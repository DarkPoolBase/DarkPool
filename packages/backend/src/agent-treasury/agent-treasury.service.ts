import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { AgentTreasury } from './entities/agent-treasury.entity';
import { TreasuryTransaction } from './entities/treasury-transaction.entity';
import { RedisService } from '../redis/redis.service';

interface CreateTreasuryConfig {
  dailySpendLimit?: string;
  monthlySpendLimit?: string;
  approvalThreshold?: string;
  yieldStrategy?: string;
}

interface ListTransactionsParams {
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}

interface UpdateLimitsDto {
  dailySpendLimit?: string;
  monthlySpendLimit?: string;
  approvalThreshold?: string;
}

export interface YieldStats {
  allocated: string;
  estimatedApy: number;
  projectedMonthlyYield: string;
}

@Injectable()
export class AgentTreasuryService {
  private readonly logger = new Logger(AgentTreasuryService.name);

  constructor(
    @InjectRepository(AgentTreasury) private treasuryRepo: Repository<AgentTreasury>,
    @InjectRepository(TreasuryTransaction) private txRepo: Repository<TreasuryTransaction>,
    private redis: RedisService,
  ) {}

  // ---------------------------------------------------------------------------
  // Treasury lifecycle
  // ---------------------------------------------------------------------------

  async createTreasury(
    agentId: string,
    ownerAddress: string,
    treasuryAddress: string,
    config?: CreateTreasuryConfig,
  ): Promise<AgentTreasury> {
    const existing = await this.treasuryRepo.findOne({ where: { agentId } });
    if (existing) {
      throw new BadRequestException('Treasury already exists for this agent');
    }

    const treasury = this.treasuryRepo.create({
      agentId,
      ownerAddress,
      treasuryAddress,
      dailySpendLimit: config?.dailySpendLimit ?? '1000.000000',
      monthlySpendLimit: config?.monthlySpendLimit ?? '25000.000000',
      approvalThreshold: config?.approvalThreshold ?? '5000.000000',
      yieldStrategy: config?.yieldStrategy ?? 'NONE',
    });

    const saved = await this.treasuryRepo.save(treasury);

    await this.redis.publish('agent-treasury', JSON.stringify({ event: 'created', agentId }));
    this.logger.log(`Treasury created for agent ${agentId}`);

    return saved;
  }

  async getTreasury(agentId: string): Promise<AgentTreasury> {
    const treasury = await this.treasuryRepo.findOne({ where: { agentId } });
    if (!treasury) {
      throw new NotFoundException(`Treasury not found for agent ${agentId}`);
    }
    return treasury;
  }

  async listTreasuries(ownerAddress?: string): Promise<AgentTreasury[]> {
    if (ownerAddress) {
      return this.treasuryRepo.find({ where: { ownerAddress } });
    }
    return this.treasuryRepo.find();
  }

  // ---------------------------------------------------------------------------
  // Transactions
  // ---------------------------------------------------------------------------

  async deposit(agentId: string, amount: string): Promise<TreasuryTransaction> {
    const treasury = await this.getTreasury(agentId);
    const amountNum = parseFloat(amount);
    if (amountNum <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    treasury.balance = (parseFloat(treasury.balance) + amountNum).toFixed(6);
    treasury.totalDeposited = (parseFloat(treasury.totalDeposited) + amountNum).toFixed(6);
    await this.treasuryRepo.save(treasury);

    const tx = this.txRepo.create({
      treasuryId: treasury.id,
      type: 'DEPOSIT',
      amount,
      status: 'EXECUTED',
    });
    const saved = await this.txRepo.save(tx);

    await this.redis.publish(
      'agent-treasury',
      JSON.stringify({ event: 'deposit', agentId, amount }),
    );

    return saved;
  }

  async withdraw(
    agentId: string,
    amount: string,
    ownerAddress: string,
  ): Promise<TreasuryTransaction> {
    const treasury = await this.getTreasury(agentId);

    if (treasury.ownerAddress.toLowerCase() !== ownerAddress.toLowerCase()) {
      throw new ForbiddenException('Only the treasury owner can withdraw');
    }

    const amountNum = parseFloat(amount);
    if (amountNum <= 0) {
      throw new BadRequestException('Amount must be positive');
    }
    if (amountNum > parseFloat(treasury.balance)) {
      throw new BadRequestException('Insufficient balance');
    }

    treasury.balance = (parseFloat(treasury.balance) - amountNum).toFixed(6);
    treasury.totalWithdrawn = (parseFloat(treasury.totalWithdrawn) + amountNum).toFixed(6);
    await this.treasuryRepo.save(treasury);

    const tx = this.txRepo.create({
      treasuryId: treasury.id,
      type: 'WITHDRAWAL',
      amount,
      recipient: ownerAddress,
      status: 'EXECUTED',
    });
    const saved = await this.txRepo.save(tx);

    await this.redis.publish(
      'agent-treasury',
      JSON.stringify({ event: 'withdrawal', agentId, amount }),
    );

    return saved;
  }

  async spend(
    agentId: string,
    amount: string,
    recipient: string,
    description?: string,
  ): Promise<TreasuryTransaction> {
    const treasury = await this.getTreasury(agentId);
    const amountNum = parseFloat(amount);

    if (amountNum <= 0) {
      throw new BadRequestException('Amount must be positive');
    }
    if (amountNum > parseFloat(treasury.balance)) {
      throw new BadRequestException('Insufficient balance');
    }

    await this.checkSpendLimits(treasury.id, amountNum, treasury);

    const requiresApproval = amountNum >= parseFloat(treasury.approvalThreshold);

    if (requiresApproval) {
      // Create pending transaction requiring human approval
      const tx = this.txRepo.create({
        treasuryId: treasury.id,
        type: 'SPEND',
        amount,
        recipient,
        description: description ?? null,
        requiresApproval: true,
        status: 'PENDING',
      });
      const saved = await this.txRepo.save(tx);

      await this.redis.publish(
        'agent-treasury',
        JSON.stringify({ event: 'spend_pending_approval', agentId, amount, txId: saved.id }),
      );

      return saved;
    }

    // Auto-approve under threshold
    treasury.balance = (parseFloat(treasury.balance) - amountNum).toFixed(6);
    treasury.totalSpent = (parseFloat(treasury.totalSpent) + amountNum).toFixed(6);
    await this.treasuryRepo.save(treasury);

    const tx = this.txRepo.create({
      treasuryId: treasury.id,
      type: 'SPEND',
      amount,
      recipient,
      description: description ?? null,
      requiresApproval: false,
      approved: true,
      status: 'EXECUTED',
    });
    const saved = await this.txRepo.save(tx);

    await this.redis.publish(
      'agent-treasury',
      JSON.stringify({ event: 'spend_executed', agentId, amount }),
    );

    return saved;
  }

  async micropayment(
    agentId: string,
    amount: string,
    recipient: string,
    description?: string,
  ): Promise<TreasuryTransaction> {
    const treasury = await this.getTreasury(agentId);
    const amountNum = parseFloat(amount);

    if (amountNum <= 0) {
      throw new BadRequestException('Amount must be positive');
    }
    if (amountNum > parseFloat(treasury.balance)) {
      throw new BadRequestException('Insufficient balance');
    }

    await this.checkSpendLimits(treasury.id, amountNum, treasury);

    treasury.balance = (parseFloat(treasury.balance) - amountNum).toFixed(6);
    treasury.totalSpent = (parseFloat(treasury.totalSpent) + amountNum).toFixed(6);
    await this.treasuryRepo.save(treasury);

    const tx = this.txRepo.create({
      treasuryId: treasury.id,
      type: 'MICROPAYMENT',
      amount,
      recipient,
      description: description ?? null,
      requiresApproval: false,
      approved: true,
      status: 'EXECUTED',
    });
    const saved = await this.txRepo.save(tx);

    await this.redis.publish(
      'agent-treasury',
      JSON.stringify({ event: 'micropayment', agentId, amount, recipient }),
    );

    return saved;
  }

  // ---------------------------------------------------------------------------
  // Approvals
  // ---------------------------------------------------------------------------

  async approveTransaction(txId: string, approverAddress: string): Promise<TreasuryTransaction> {
    const tx = await this.txRepo.findOne({ where: { id: txId } });
    if (!tx) {
      throw new NotFoundException(`Transaction ${txId} not found`);
    }
    if (tx.status !== 'PENDING') {
      throw new BadRequestException('Transaction is not pending approval');
    }

    const treasury = await this.treasuryRepo.findOne({ where: { id: tx.treasuryId } });
    if (!treasury) {
      throw new NotFoundException('Treasury not found');
    }

    if (treasury.ownerAddress.toLowerCase() !== approverAddress.toLowerCase()) {
      throw new ForbiddenException('Only the treasury owner can approve transactions');
    }

    const amountNum = parseFloat(tx.amount);
    if (amountNum > parseFloat(treasury.balance)) {
      throw new BadRequestException('Insufficient balance to execute transaction');
    }

    treasury.balance = (parseFloat(treasury.balance) - amountNum).toFixed(6);
    treasury.totalSpent = (parseFloat(treasury.totalSpent) + amountNum).toFixed(6);
    await this.treasuryRepo.save(treasury);

    tx.approved = true;
    tx.approvedBy = approverAddress;
    tx.status = 'EXECUTED';
    const saved = await this.txRepo.save(tx);

    await this.redis.publish(
      'agent-treasury',
      JSON.stringify({ event: 'transaction_approved', txId, agentId: treasury.agentId }),
    );

    return saved;
  }

  async rejectTransaction(txId: string, approverAddress: string): Promise<TreasuryTransaction> {
    const tx = await this.txRepo.findOne({ where: { id: txId } });
    if (!tx) {
      throw new NotFoundException(`Transaction ${txId} not found`);
    }
    if (tx.status !== 'PENDING') {
      throw new BadRequestException('Transaction is not pending approval');
    }

    const treasury = await this.treasuryRepo.findOne({ where: { id: tx.treasuryId } });
    if (!treasury) {
      throw new NotFoundException('Treasury not found');
    }

    if (treasury.ownerAddress.toLowerCase() !== approverAddress.toLowerCase()) {
      throw new ForbiddenException('Only the treasury owner can reject transactions');
    }

    tx.approved = false;
    tx.approvedBy = approverAddress;
    tx.status = 'REJECTED';
    const saved = await this.txRepo.save(tx);

    await this.redis.publish(
      'agent-treasury',
      JSON.stringify({ event: 'transaction_rejected', txId, agentId: treasury.agentId }),
    );

    return saved;
  }

  // ---------------------------------------------------------------------------
  // Yield management
  // ---------------------------------------------------------------------------

  async allocateToYield(agentId: string, amount: string): Promise<AgentTreasury> {
    const treasury = await this.getTreasury(agentId);
    const amountNum = parseFloat(amount);

    if (amountNum <= 0) {
      throw new BadRequestException('Amount must be positive');
    }
    if (amountNum > parseFloat(treasury.balance)) {
      throw new BadRequestException('Insufficient balance');
    }
    if (treasury.yieldStrategy === 'NONE') {
      throw new BadRequestException('Set a yield strategy before allocating');
    }

    treasury.balance = (parseFloat(treasury.balance) - amountNum).toFixed(6);
    treasury.allocatedToYield = (parseFloat(treasury.allocatedToYield) + amountNum).toFixed(6);
    const saved = await this.treasuryRepo.save(treasury);

    const tx = this.txRepo.create({
      treasuryId: treasury.id,
      type: 'YIELD_DEPOSIT',
      amount,
      status: 'EXECUTED',
      approved: true,
    });
    await this.txRepo.save(tx);

    await this.redis.publish(
      'agent-treasury',
      JSON.stringify({ event: 'yield_allocated', agentId, amount }),
    );

    return saved;
  }

  async withdrawFromYield(agentId: string, amount: string): Promise<AgentTreasury> {
    const treasury = await this.getTreasury(agentId);
    const amountNum = parseFloat(amount);

    if (amountNum <= 0) {
      throw new BadRequestException('Amount must be positive');
    }
    if (amountNum > parseFloat(treasury.allocatedToYield)) {
      throw new BadRequestException('Insufficient yield allocation');
    }

    treasury.allocatedToYield = (parseFloat(treasury.allocatedToYield) - amountNum).toFixed(6);
    treasury.balance = (parseFloat(treasury.balance) + amountNum).toFixed(6);
    const saved = await this.treasuryRepo.save(treasury);

    const tx = this.txRepo.create({
      treasuryId: treasury.id,
      type: 'YIELD_WITHDRAW',
      amount,
      status: 'EXECUTED',
      approved: true,
    });
    await this.txRepo.save(tx);

    await this.redis.publish(
      'agent-treasury',
      JSON.stringify({ event: 'yield_withdrawn', agentId, amount }),
    );

    return saved;
  }

  async getYieldStats(agentId: string): Promise<YieldStats> {
    const treasury = await this.getTreasury(agentId);
    const allocated = parseFloat(treasury.allocatedToYield);

    // Estimated APY based on strategy
    const apyMap: Record<string, number> = {
      NONE: 0,
      CONSERVATIVE: 3.5,
      BALANCED: 6.2,
      AGGRESSIVE: 11.8,
    };
    const estimatedApy = apyMap[treasury.yieldStrategy] ?? 0;
    const projectedMonthlyYield = ((allocated * estimatedApy) / 100 / 12).toFixed(6);

    return {
      allocated: treasury.allocatedToYield,
      estimatedApy,
      projectedMonthlyYield,
    };
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  async updateLimits(agentId: string, limits: UpdateLimitsDto): Promise<AgentTreasury> {
    const treasury = await this.getTreasury(agentId);

    if (limits.dailySpendLimit !== undefined) {
      treasury.dailySpendLimit = limits.dailySpendLimit;
    }
    if (limits.monthlySpendLimit !== undefined) {
      treasury.monthlySpendLimit = limits.monthlySpendLimit;
    }
    if (limits.approvalThreshold !== undefined) {
      treasury.approvalThreshold = limits.approvalThreshold;
    }

    return this.treasuryRepo.save(treasury);
  }

  async setYieldStrategy(agentId: string, strategy: string): Promise<AgentTreasury> {
    const validStrategies = ['NONE', 'CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'];
    if (!validStrategies.includes(strategy)) {
      throw new BadRequestException(`Invalid strategy. Must be one of: ${validStrategies.join(', ')}`);
    }

    const treasury = await this.getTreasury(agentId);
    treasury.yieldStrategy = strategy;
    return this.treasuryRepo.save(treasury);
  }

  // ---------------------------------------------------------------------------
  // Transaction listing
  // ---------------------------------------------------------------------------

  async listTransactions(
    agentId: string,
    params: ListTransactionsParams,
  ): Promise<{ data: TreasuryTransaction[]; total: number; page: number; limit: number }> {
    const treasury = await this.getTreasury(agentId);
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const where: Record<string, unknown> = { treasuryId: treasury.id };
    if (params.type) where.type = params.type;
    if (params.status) where.status = params.status;

    const [data, total] = await this.txRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  private async checkSpendLimits(
    treasuryId: string,
    amount: number,
    treasury: AgentTreasury,
  ): Promise<void> {
    const todaySpend = await this.getTodaySpend(treasuryId);
    if (todaySpend + amount > parseFloat(treasury.dailySpendLimit)) {
      throw new BadRequestException('Daily spend limit exceeded');
    }

    const monthSpend = await this.getMonthSpend(treasuryId);
    if (monthSpend + amount > parseFloat(treasury.monthlySpendLimit)) {
      throw new BadRequestException('Monthly spend limit exceeded');
    }
  }

  private async getTodaySpend(treasuryId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.txRepo
      .createQueryBuilder('tx')
      .select('COALESCE(SUM(tx.amount), 0)', 'total')
      .where('tx.treasury_id = :treasuryId', { treasuryId })
      .andWhere('tx.type IN (:...types)', { types: ['SPEND', 'MICROPAYMENT'] })
      .andWhere('tx.status = :status', { status: 'EXECUTED' })
      .andWhere('tx.created_at >= :today', { today })
      .getRawOne();

    return parseFloat(result?.total ?? '0');
  }

  private async getMonthSpend(treasuryId: string): Promise<number> {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const result = await this.txRepo
      .createQueryBuilder('tx')
      .select('COALESCE(SUM(tx.amount), 0)', 'total')
      .where('tx.treasury_id = :treasuryId', { treasuryId })
      .andWhere('tx.type IN (:...types)', { types: ['SPEND', 'MICROPAYMENT'] })
      .andWhere('tx.status = :status', { status: 'EXECUTED' })
      .andWhere('tx.created_at >= :monthStart', { monthStart })
      .getRawOne();

    return parseFloat(result?.total ?? '0');
  }
}
