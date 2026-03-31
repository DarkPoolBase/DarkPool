import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Provider } from './entities/provider.entity';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(Provider) private providerRepo: Repository<Provider>,
  ) {}

  async register(
    userId: string,
    data: {
      name: string;
      gpuTypes: { type: string; count: number; available: number }[];
      region?: string;
    },
  ): Promise<Provider> {
    const provider = this.providerRepo.create({
      userId,
      name: data.name,
      gpuTypes: data.gpuTypes,
      region: data.region ?? null,
    });
    return this.providerRepo.save(provider);
  }

  async findAll(page = 1, limit = 20): Promise<{ data: Provider[]; total: number }> {
    const [data, total] = await this.providerRepo.findAndCount({
      where: { status: 'ACTIVE' },
      order: { reputation: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async findById(id: string): Promise<Provider> {
    const provider = await this.providerRepo.findOne({ where: { id } });
    if (!provider) throw new NotFoundException('Provider not found');
    return provider;
  }

  async updateCapacity(
    id: string,
    userId: string,
    gpuTypes: { type: string; count: number; available: number }[],
  ): Promise<Provider> {
    const provider = await this.providerRepo.findOne({
      where: { id, userId },
    });
    if (!provider) throw new NotFoundException('Provider not found');

    provider.gpuTypes = gpuTypes;
    return this.providerRepo.save(provider);
  }

  async getReputation(id: string): Promise<{
    reputation: number;
    uptimePct: number;
    totalJobs: number;
  }> {
    const provider = await this.findById(id);
    return {
      reputation: provider.reputation,
      uptimePct: provider.uptimePct,
      totalJobs: provider.totalJobs,
    };
  }
}

