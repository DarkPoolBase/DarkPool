import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeeJob } from './entities/tee-job.entity';
import { TeeNode } from './entities/tee-node.entity';
import { RedisService } from '../redis/redis.service';

interface SubmitJobDto {
  container: string;
  encryptedInput: string;
  gpuType: string;
  maxDuration?: number;
}

@Injectable()
export class TeeComputeService {
  constructor(
    @InjectRepository(TeeJob) private jobRepo: Repository<TeeJob>,
    @InjectRepository(TeeNode) private nodeRepo: Repository<TeeNode>,
    private redis: RedisService,
  ) {}

  async submitJob(userId: string, data: SubmitJobDto): Promise<TeeJob> {
    const node = await this.assignNode(data.gpuType);

    const job = this.jobRepo.create({
      userId,
      container: data.container,
      encryptedInput: data.encryptedInput,
      gpuType: data.gpuType,
      maxDuration: data.maxDuration ?? 3600,
      status: node ? 'QUEUED' : 'PENDING',
      nodeId: node?.id ?? null,
    });

    const saved = await this.jobRepo.save(job);

    if (node) {
      node.currentJobs++;
      await this.nodeRepo.save(node);
    }

    await this.redis.publish(
      'adp:events:tee',
      JSON.stringify({
        type: 'job:submitted',
        jobId: saved.id,
        userId,
        gpuType: data.gpuType,
        nodeId: node?.id ?? null,
      }),
    );

    return saved;
  }

  async getJobStatus(jobId: string): Promise<TeeJob> {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('TEE job not found');
    return job;
  }

  async getJobResult(jobId: string): Promise<{
    jobId: string;
    encryptedResult: string;
    proofHash: string;
    completedAt: string;
  }> {
    const job = await this.getJobStatus(jobId);
    if (job.status !== 'COMPLETED') {
      throw new BadRequestException('Job is not completed yet');
    }
    return {
      jobId: job.id,
      encryptedResult: job.encryptedResult!,
      proofHash: job.proofHash!,
      completedAt: job.completedAt!.toISOString(),
    };
  }

  async cancelJob(jobId: string, userId: string): Promise<TeeJob> {
    const job = await this.getJobStatus(jobId);
    if (job.userId !== userId) {
      throw new ForbiddenException('Not authorized to cancel this job');
    }
    if (!['PENDING', 'QUEUED'].includes(job.status)) {
      throw new BadRequestException('Job can only be cancelled when PENDING or QUEUED');
    }

    job.status = 'CANCELLED';
    const saved = await this.jobRepo.save(job);

    if (job.nodeId) {
      const node = await this.nodeRepo.findOne({ where: { id: job.nodeId } });
      if (node && node.currentJobs > 0) {
        node.currentJobs--;
        await this.nodeRepo.save(node);
      }
    }

    await this.redis.publish(
      'adp:events:tee',
      JSON.stringify({ type: 'job:cancelled', jobId: job.id, userId }),
    );

    return saved;
  }

  async listJobs(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: TeeJob[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.jobRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async registerNode(
    nodeAddress: string,
    enclaveId: string,
    gpuTypes: Array<{ type: string; count: number; available: number }>,
    region?: string,
  ): Promise<TeeNode> {
    const node = this.nodeRepo.create({
      nodeAddress,
      enclaveId,
      gpuTypes,
      region: region ?? 'us-east-1',
      lastHeartbeat: new Date(),
    });

    const saved = await this.nodeRepo.save(node);

    await this.redis.publish(
      'adp:events:tee',
      JSON.stringify({ type: 'node:registered', nodeId: saved.id, nodeAddress }),
    );

    return saved;
  }

  async updateNodeHeartbeat(nodeId: string): Promise<void> {
    const node = await this.nodeRepo.findOne({ where: { id: nodeId } });
    if (!node) throw new NotFoundException('TEE node not found');

    node.lastHeartbeat = new Date();
    await this.nodeRepo.save(node);
  }

  async listNodes(): Promise<TeeNode[]> {
    return this.nodeRepo.find({
      where: { status: 'ACTIVE' },
      order: { currentJobs: 'ASC' },
    });
  }

  private async assignNode(gpuType: string): Promise<TeeNode | null> {
    const nodes = await this.nodeRepo
      .createQueryBuilder('node')
      .where('node.status = :status', { status: 'ACTIVE' })
      .andWhere('node.current_jobs < node.max_concurrent_jobs')
      .orderBy('node.current_jobs', 'ASC')
      .getMany();

    for (const node of nodes) {
      const hasGpu = node.gpuTypes.some(
        (g) => g.type === gpuType && g.available > 0,
      );
      if (hasGpu) return node;
    }

    return null;
  }
}
