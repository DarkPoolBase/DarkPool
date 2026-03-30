import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComplianceProof } from './entities/compliance-proof.entity';
import { ComplianceConfig } from './entities/compliance-config.entity';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(
    @InjectRepository(ComplianceProof) private proofRepo: Repository<ComplianceProof>,
    @InjectRepository(ComplianceConfig) private configRepo: Repository<ComplianceConfig>,
    private redis: RedisService,
  ) {}

  async submitProof(
    userId: string,
    data: {
      proofType: string;
      jurisdiction: string;
      proofHash: string;
      publicInputsHash: string;
    },
  ): Promise<ComplianceProof> {
    const proof = this.proofRepo.create({
      userId,
      proofType: data.proofType,
      jurisdiction: data.jurisdiction,
      proofHash: data.proofHash,
      publicInputsHash: data.publicInputsHash,
    });

    const saved = await this.proofRepo.save(proof);

    await this.redis.publish(
      'adp:events:compliance',
      JSON.stringify({
        type: 'proof:submitted',
        proofId: saved.id,
        userId,
        proofType: data.proofType,
        jurisdiction: data.jurisdiction,
      }),
    );

    this.logger.log(`Compliance proof submitted: ${saved.id} (${data.proofType}/${data.jurisdiction})`);
    return saved;
  }

  async verifyProof(proofId: string): Promise<ComplianceProof> {
    const proof = await this.proofRepo.findOne({ where: { id: proofId } });
    if (!proof) throw new NotFoundException('Compliance proof not found');

    const config = await this.configRepo.findOne({
      where: { jurisdiction: proof.jurisdiction },
    });

    const expiryDays = config?.proofExpiryDays ?? 365;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);

    proof.status = 'VERIFIED';
    proof.verifiedAt = now;
    proof.expiresAt = expiresAt;

    const saved = await this.proofRepo.save(proof);

    await this.redis.publish(
      'adp:events:compliance',
      JSON.stringify({
        type: 'proof:verified',
        proofId: saved.id,
        userId: saved.userId,
        proofType: saved.proofType,
        jurisdiction: saved.jurisdiction,
        expiresAt: expiresAt.toISOString(),
      }),
    );

    this.logger.log(`Compliance proof verified: ${proofId}`);
    return saved;
  }

  async rejectProof(proofId: string, reason: string): Promise<ComplianceProof> {
    const proof = await this.proofRepo.findOne({ where: { id: proofId } });
    if (!proof) throw new NotFoundException('Compliance proof not found');

    proof.status = 'REJECTED';
    proof.metadata = { ...proof.metadata, rejectionReason: reason };

    const saved = await this.proofRepo.save(proof);

    await this.redis.publish(
      'adp:events:compliance',
      JSON.stringify({
        type: 'proof:rejected',
        proofId: saved.id,
        userId: saved.userId,
        reason,
      }),
    );

    this.logger.log(`Compliance proof rejected: ${proofId} - ${reason}`);
    return saved;
  }

  async getProof(proofId: string): Promise<ComplianceProof> {
    const proof = await this.proofRepo.findOne({ where: { id: proofId } });
    if (!proof) throw new NotFoundException('Compliance proof not found');
    return proof;
  }

  async listUserProofs(
    userId: string,
    proofType?: string,
    jurisdiction?: string,
  ): Promise<ComplianceProof[]> {
    const where: Record<string, string> = { userId };
    if (proofType) where.proofType = proofType;
    if (jurisdiction) where.jurisdiction = jurisdiction;

    return this.proofRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async checkCompliance(
    userId: string,
    jurisdiction: string,
  ): Promise<{
    amlVerified: boolean;
    kycVerified: boolean;
    taxVerified: boolean;
    compliant: boolean;
  }> {
    const config = await this.configRepo.findOne({ where: { jurisdiction } });
    if (!config) throw new NotFoundException(`Jurisdiction config not found: ${jurisdiction}`);

    const proofs = await this.proofRepo.find({ where: { userId, jurisdiction } });

    const amlVerified = proofs.some(
      (p) => p.proofType === 'AML' && this.isProofValid(p),
    );
    const kycVerified = proofs.some(
      (p) => p.proofType === 'KYC' && this.isProofValid(p),
    );
    const taxVerified = proofs.some(
      (p) => p.proofType === 'TAX' && this.isProofValid(p),
    );

    const compliant =
      (!config.amlRequired || amlVerified) &&
      (!config.kycRequired || kycVerified) &&
      (!config.taxReportingRequired || taxVerified);

    return { amlVerified, kycVerified, taxVerified, compliant };
  }

  async getJurisdictionConfig(jurisdiction: string): Promise<ComplianceConfig> {
    const config = await this.configRepo.findOne({ where: { jurisdiction } });
    if (!config) throw new NotFoundException(`Jurisdiction config not found: ${jurisdiction}`);
    return config;
  }

  async setJurisdictionConfig(
    jurisdiction: string,
    data: Partial<Omit<ComplianceConfig, 'id' | 'jurisdiction' | 'createdAt' | 'updatedAt'>>,
  ): Promise<ComplianceConfig> {
    let config = await this.configRepo.findOne({ where: { jurisdiction } });

    if (config) {
      Object.assign(config, data);
    } else {
      config = this.configRepo.create({ jurisdiction, ...data });
    }

    const saved = await this.configRepo.save(config);
    this.logger.log(`Jurisdiction config updated: ${jurisdiction}`);
    return saved;
  }

  async listJurisdictions(): Promise<ComplianceConfig[]> {
    return this.configRepo.find({
      where: { active: true },
      order: { jurisdiction: 'ASC' },
    });
  }

  private isProofValid(proof: ComplianceProof): boolean {
    return (
      proof.status === 'VERIFIED' &&
      proof.expiresAt !== null &&
      proof.expiresAt > new Date()
    );
  }
}
