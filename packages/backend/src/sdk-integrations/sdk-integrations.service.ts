import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SdkGrant } from './entities/sdk-grant.entity';
import { RedisService } from '../redis/redis.service';

interface SdkPackage {
  name: string;
  version: string;
  description: string;
  docsUrl: string;
  registeredAt: string;
}

interface SponsoredTxParams {
  paymasterUrl: string;
  paymasterData: string;
  maxGasLimit: string;
  sponsored: boolean;
}

@Injectable()
export class SdkIntegrationsService {
  private readonly logger = new Logger(SdkIntegrationsService.name);
  private readonly PACKAGES_CACHE_KEY = 'adp:sdk:packages';
  private readonly SPONSOR_STATS_KEY = 'adp:sdk:sponsor:stats';

  constructor(
    @InjectRepository(SdkGrant) private grantRepo: Repository<SdkGrant>,
    private redis: RedisService,
  ) {}

  // ── Base Developer Docs integration ──────────────────────────────────

  async registerSdkPackage(
    name: string,
    version: string,
    description: string,
    docsUrl: string,
  ): Promise<SdkPackage> {
    const pkg: SdkPackage = {
      name,
      version,
      description,
      docsUrl,
      registeredAt: new Date().toISOString(),
    };

    const existing = await this.getSdkPackages();
    const idx = existing.findIndex((p) => p.name === name);
    if (idx >= 0) {
      existing[idx] = pkg;
    } else {
      existing.push(pkg);
    }

    await this.redis.set(this.PACKAGES_CACHE_KEY, JSON.stringify(existing));

    await this.redis.publish(
      'adp:events:sdk',
      JSON.stringify({
        type: 'package:registered',
        name,
        version,
        docsUrl,
      }),
    );

    this.logger.log(`SDK package registered: ${name}@${version}`);
    return pkg;
  }

  async getSdkPackages(): Promise<SdkPackage[]> {
    const raw = await this.redis.get(this.PACKAGES_CACHE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SdkPackage[];
  }

  // ── Coinbase Ventures grants ─────────────────────────────────────────

  async applyForGrant(
    applicantAddress: string,
    projectName: string,
    projectDescription: string,
    grantAmount: string,
  ): Promise<SdkGrant> {
    const grant = this.grantRepo.create({
      applicantAddress,
      projectName,
      projectDescription,
      grantAmount,
    });

    const saved = await this.grantRepo.save(grant);

    await this.redis.publish(
      'adp:events:sdk',
      JSON.stringify({
        type: 'grant:applied',
        grantId: saved.id,
        applicantAddress,
        projectName,
        grantAmount,
      }),
    );

    this.logger.log(`Grant application submitted: ${saved.id} (${projectName})`);
    return saved;
  }

  async listGrants(status?: string): Promise<SdkGrant[]> {
    const where: Record<string, string> = {};
    if (status) where.status = status;

    return this.grantRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async approveGrant(grantId: string): Promise<SdkGrant> {
    const grant = await this.grantRepo.findOne({ where: { id: grantId } });
    if (!grant) throw new NotFoundException('Grant not found');

    grant.status = 'APPROVED';
    grant.reviewedAt = new Date();

    const saved = await this.grantRepo.save(grant);

    await this.redis.publish(
      'adp:events:sdk',
      JSON.stringify({
        type: 'grant:approved',
        grantId: saved.id,
        applicantAddress: saved.applicantAddress,
        projectName: saved.projectName,
      }),
    );

    this.logger.log(`Grant approved: ${grantId}`);
    return saved;
  }

  async rejectGrant(grantId: string): Promise<SdkGrant> {
    const grant = await this.grantRepo.findOne({ where: { id: grantId } });
    if (!grant) throw new NotFoundException('Grant not found');

    grant.status = 'REJECTED';
    grant.reviewedAt = new Date();

    const saved = await this.grantRepo.save(grant);

    await this.redis.publish(
      'adp:events:sdk',
      JSON.stringify({
        type: 'grant:rejected',
        grantId: saved.id,
        applicantAddress: saved.applicantAddress,
        projectName: saved.projectName,
      }),
    );

    this.logger.log(`Grant rejected: ${grantId}`);
    return saved;
  }

  async disburseGrant(grantId: string): Promise<SdkGrant> {
    const grant = await this.grantRepo.findOne({ where: { id: grantId } });
    if (!grant) throw new NotFoundException('Grant not found');

    grant.status = 'DISBURSED';
    grant.disbursedAt = new Date();

    const saved = await this.grantRepo.save(grant);

    await this.redis.publish(
      'adp:events:sdk',
      JSON.stringify({
        type: 'grant:disbursed',
        grantId: saved.id,
        applicantAddress: saved.applicantAddress,
        projectName: saved.projectName,
        grantAmount: saved.grantAmount,
      }),
    );

    this.logger.log(`Grant disbursed: ${grantId}`);
    return saved;
  }

  // ── Base Paymaster integration ───────────────────────────────────────

  async sponsorTransaction(
    userAddress: string,
    txData: string,
  ): Promise<SponsoredTxParams> {
    const paymasterData = Buffer.from(
      JSON.stringify({ userAddress, txData, timestamp: Date.now() }),
    ).toString('base64');

    // Track sponsorship stats
    const statsRaw = await this.redis.get(this.SPONSOR_STATS_KEY);
    const stats = statsRaw
      ? JSON.parse(statsRaw)
      : { totalSponsored: 0, totalGasSaved: '0' };

    stats.totalSponsored += 1;
    const estimatedGas = BigInt('21000') * BigInt('1000000000'); // 21k gas * 1 gwei
    stats.totalGasSaved = (
      BigInt(stats.totalGasSaved) + estimatedGas
    ).toString();

    await this.redis.set(this.SPONSOR_STATS_KEY, JSON.stringify(stats));

    await this.redis.publish(
      'adp:events:sdk',
      JSON.stringify({
        type: 'tx:sponsored',
        userAddress,
        timestamp: new Date().toISOString(),
      }),
    );

    this.logger.log(`Transaction sponsored for ${userAddress}`);

    return {
      paymasterUrl: 'https://paymaster.base.org/api/v1/sponsor',
      paymasterData,
      maxGasLimit: '500000',
      sponsored: true,
    };
  }

  async getSponsorshipStats(): Promise<{
    totalSponsored: number;
    totalGasSaved: string;
  }> {
    const raw = await this.redis.get(this.SPONSOR_STATS_KEY);
    if (!raw) return { totalSponsored: 0, totalGasSaved: '0' };
    return JSON.parse(raw);
  }
}
