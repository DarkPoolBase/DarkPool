import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataListing } from './entities/data-listing.entity';
import { DataAccessLog } from './entities/data-access-log.entity';
import { RedisService } from '../redis/redis.service';

interface CreateListingDto {
  category: string;
  format: string;
  sizeGb: number;
  metadataHash: string;
  qualityScore: number;
  pricePerAccess: string;
  privacyProof?: string;
  description?: string;
  tags?: string[];
}

interface SearchParams {
  category?: string;
  format?: string;
  minSize?: number;
  maxSize?: number;
  minQuality?: number;
  maxPrice?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class DataListingsService {
  constructor(
    @InjectRepository(DataListing) private listingRepo: Repository<DataListing>,
    @InjectRepository(DataAccessLog) private accessLogRepo: Repository<DataAccessLog>,
    private redis: RedisService,
  ) {}

  async create(
    providerId: string,
    providerWallet: string,
    data: CreateListingDto,
  ): Promise<DataListing> {
    const listing = this.listingRepo.create({
      providerId,
      providerWallet,
      category: data.category,
      format: data.format,
      sizeGb: data.sizeGb.toString(),
      metadataHash: data.metadataHash,
      qualityScore: data.qualityScore,
      pricePerAccess: data.pricePerAccess,
      privacyProof: data.privacyProof ?? null,
      description: data.description ?? null,
      tags: data.tags ?? null,
    });

    const saved = await this.listingRepo.save(listing);

    await this.redis.publish(
      'adp:events:data',
      JSON.stringify({ type: 'listing:created', listingId: saved.id, category: data.category }),
    );

    return saved;
  }

  async search(params: SearchParams): Promise<{ data: DataListing[]; total: number }> {
    const qb = this.listingRepo
      .createQueryBuilder('listing')
      .where('listing.status = :status', { status: 'ACTIVE' });

    if (params.category) {
      qb.andWhere('listing.category = :category', { category: params.category });
    }
    if (params.format) {
      qb.andWhere('listing.format = :format', { format: params.format });
    }
    if (params.minSize) {
      qb.andWhere('listing.size_gb >= :minSize', { minSize: params.minSize });
    }
    if (params.maxSize) {
      qb.andWhere('listing.size_gb <= :maxSize', { maxSize: params.maxSize });
    }
    if (params.minQuality) {
      qb.andWhere('listing.quality_score >= :minQuality', { minQuality: params.minQuality });
    }
    if (params.maxPrice) {
      qb.andWhere('listing.price_per_access <= :maxPrice', { maxPrice: params.maxPrice });
    }

    qb.orderBy('listing.quality_score', 'DESC');

    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findById(id: string): Promise<DataListing> {
    const listing = await this.listingRepo.findOne({ where: { id } });
    if (!listing) throw new NotFoundException('Data listing not found');
    return listing;
  }

  async recordAccess(
    listingId: string,
    accessorWallet: string,
    paymentAmount: string,
    txHash?: string,
  ): Promise<DataAccessLog> {
    const listing = await this.findById(listingId);
    if (listing.status !== 'ACTIVE') {
      throw new NotFoundException('Data listing not active');
    }

    listing.accessCount++;
    await this.listingRepo.save(listing);

    const log = this.accessLogRepo.create({
      listingId,
      accessorWallet,
      paymentAmount,
      txHash: txHash ?? null,
    });

    return this.accessLogRepo.save(log);
  }

  async getAccessHistory(
    listingId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: DataAccessLog[]; total: number }> {
    const [data, total] = await this.accessLogRepo.findAndCount({
      where: { listingId },
      order: { accessedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async deactivate(listingId: string, userId: string): Promise<void> {
    const listing = await this.listingRepo.findOne({
      where: { id: listingId, providerId: userId },
    });
    if (!listing) throw new NotFoundException('Data listing not found');

    listing.status = 'INACTIVE';
    await this.listingRepo.save(listing);
  }

  async getProviderListings(providerId: string): Promise<DataListing[]> {
    return this.listingRepo.find({
      where: { providerId },
      order: { createdAt: 'DESC' },
    });
  }
}
