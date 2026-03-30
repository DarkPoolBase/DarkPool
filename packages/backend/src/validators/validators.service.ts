import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Validator } from './entities/validator.entity';
import { ValidationJob } from './entities/validation-job.entity';
import { RedisService } from '../redis/redis.service';

const MIN_STAKE = 10000; // 10,000 tokens minimum
const VALIDATORS_PER_JOB = 5;
const CONSENSUS_THRESHOLD = 3; // 3-of-5

@Injectable()
export class ValidatorsService {
  private readonly logger = new Logger(ValidatorsService.name);

  constructor(
    @InjectRepository(Validator) private validatorRepo: Repository<Validator>,
    @InjectRepository(ValidationJob) private jobRepo: Repository<ValidationJob>,
    private redis: RedisService,
  ) {}

  async register(walletAddress: string, stakeAmount: string): Promise<Validator> {
    if (parseFloat(stakeAmount) < MIN_STAKE) {
      throw new BadRequestException(`Minimum stake is ${MIN_STAKE} tokens`);
    }

    const existing = await this.validatorRepo.findOne({ where: { walletAddress } });
    if (existing) throw new BadRequestException('Validator already registered');

    const validator = this.validatorRepo.create({
      walletAddress,
      stakeAmount,
    });

    return this.validatorRepo.save(validator);
  }

  async getValidator(walletAddress: string): Promise<Validator> {
    const v = await this.validatorRepo.findOne({ where: { walletAddress } });
    if (!v) throw new NotFoundException('Validator not found');
    return v;
  }

  async listValidators(): Promise<Validator[]> {
    return this.validatorRepo.find({
      where: { status: 'ACTIVE' },
      order: { performanceScore: 'DESC' },
    });
  }

  async createValidationJob(
    jobId: string,
    modelId: number,
    proofHash: string,
    feeAmount: string,
  ): Promise<ValidationJob> {
    // Select validators using round-robin with performance weighting
    const activeValidators = await this.validatorRepo.find({
      where: { status: 'ACTIVE' },
      order: { performanceScore: 'DESC' },
      take: VALIDATORS_PER_JOB * 2, // Pool of candidates
    });

    if (activeValidators.length < CONSENSUS_THRESHOLD) {
      throw new BadRequestException('Not enough active validators');
    }

    // Weighted random selection based on performance score
    const selected = activeValidators
      .slice(0, Math.min(VALIDATORS_PER_JOB, activeValidators.length))
      .map((v) => v.walletAddress);

    const job = this.jobRepo.create({
      jobId,
      modelId,
      proofHash,
      assignedValidators: selected,
      feeAmount,
    });

    const saved = await this.jobRepo.save(job);

    // Notify assigned validators via Redis
    await this.redis.publish(
      'adp:events:validation',
      JSON.stringify({
        type: 'job:assigned',
        jobId: saved.id,
        proofHash,
        assignedTo: selected,
      }),
    );

    return saved;
  }

  async submitVote(
    validationJobId: string,
    validatorWallet: string,
    isValid: boolean,
  ): Promise<{ consensusReached: boolean; result?: boolean }> {
    const job = await this.jobRepo.findOne({ where: { id: validationJobId } });
    if (!job) throw new NotFoundException('Validation job not found');
    if (job.status !== 'PENDING') throw new BadRequestException('Job not pending');

    if (!job.assignedValidators.includes(validatorWallet)) {
      throw new BadRequestException('Not assigned to this job');
    }

    if (job.votes[validatorWallet] !== undefined) {
      throw new BadRequestException('Already voted');
    }

    // Record vote
    job.votes[validatorWallet] = isValid;

    // Check consensus (3-of-5)
    const votes = Object.values(job.votes);
    const approvals = votes.filter((v) => v === true).length;
    const rejections = votes.filter((v) => v === false).length;

    if (approvals >= CONSENSUS_THRESHOLD) {
      job.consensusReached = true;
      job.consensusResult = true;
      job.status = 'ACCEPTED';
      await this.distributeRewards(job);
    } else if (rejections >= CONSENSUS_THRESHOLD) {
      job.consensusReached = true;
      job.consensusResult = false;
      job.status = 'REJECTED';
      await this.handleRejection(job);
    }

    await this.jobRepo.save(job);

    // Update validator stats
    const validator = await this.validatorRepo.findOne({
      where: { walletAddress: validatorWallet },
    });
    if (validator) {
      validator.totalValidations++;
      await this.validatorRepo.save(validator);
    }

    return {
      consensusReached: job.consensusReached,
      result: job.consensusResult ?? undefined,
    };
  }

  private async distributeRewards(job: ValidationJob): Promise<void> {
    const feePerValidator =
      parseFloat(job.feeAmount) / job.assignedValidators.length;

    for (const wallet of job.assignedValidators) {
      const validator = await this.validatorRepo.findOne({
        where: { walletAddress: wallet },
      });
      if (validator) {
        validator.totalEarned = (
          parseFloat(validator.totalEarned) + feePerValidator
        ).toFixed(6);
        if (job.votes[wallet] === true) {
          validator.correctValidations++;
        }
        await this.validatorRepo.save(validator);
      }
    }

    this.logger.log(`Distributed ${job.feeAmount} across ${job.assignedValidators.length} validators`);
  }

  private async handleRejection(job: ValidationJob): Promise<void> {
    // Slash validators who voted incorrectly (voted true on rejected proof)
    for (const [wallet, vote] of Object.entries(job.votes)) {
      if (vote === true) {
        const validator = await this.validatorRepo.findOne({
          where: { walletAddress: wallet },
        });
        if (validator) {
          // 10% slash
          const slashAmount = parseFloat(validator.stakeAmount) * 0.1;
          validator.stakeAmount = (
            parseFloat(validator.stakeAmount) - slashAmount
          ).toFixed(6);
          validator.performanceScore = Math.max(
            0,
            validator.performanceScore - 5,
          );

          if (parseFloat(validator.stakeAmount) < MIN_STAKE) {
            validator.status = 'SUSPENDED';
          }

          await this.validatorRepo.save(validator);
          this.logger.warn(`Slashed validator ${wallet} by ${slashAmount}`);
        }
      }
    }
  }

  async getJobStatus(jobId: string): Promise<ValidationJob> {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Validation job not found');
    return job;
  }
}
