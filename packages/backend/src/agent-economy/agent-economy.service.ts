import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentReward } from './entities/agent-reward.entity';
import { AgentKitSession } from './entities/agent-kit-session.entity';
import { RedisService } from '../redis/redis.service';

interface RewardInput {
  agentId: string;
  rewardType: string;
  amount: string;
}

interface EpochSummary {
  epoch: number;
  totalDistributed: string;
  rewardCount: number;
  byType: Record<string, { count: number; total: string }>;
}

@Injectable()
export class AgentEconomyService {
  private readonly logger = new Logger(AgentEconomyService.name);

  constructor(
    @InjectRepository(AgentReward) private rewardRepo: Repository<AgentReward>,
    @InjectRepository(AgentKitSession) private sessionRepo: Repository<AgentKitSession>,
    private redis: RedisService,
  ) {}

  // ---------------------------------------------------------------------------
  // Reputation Mining rewards
  // ---------------------------------------------------------------------------

  async distributeRewards(epoch: number, rewards: RewardInput[]): Promise<AgentReward[]> {
    const entities = rewards.map((r) =>
      this.rewardRepo.create({
        agentId: r.agentId,
        rewardType: r.rewardType,
        amount: r.amount,
        epoch,
        status: 'DISTRIBUTED',
      }),
    );

    const saved = await this.rewardRepo.save(entities);

    await this.redis.publish(
      'agent-economy',
      JSON.stringify({ event: 'rewards_distributed', epoch, count: saved.length }),
    );
    this.logger.log(`Distributed ${saved.length} rewards for epoch ${epoch}`);

    return saved;
  }

  async claimReward(rewardId: string, agentId: string): Promise<AgentReward> {
    const reward = await this.rewardRepo.findOne({ where: { id: rewardId } });
    if (!reward) {
      throw new NotFoundException(`Reward ${rewardId} not found`);
    }
    if (reward.agentId !== agentId) {
      throw new BadRequestException('Reward does not belong to this agent');
    }
    if (reward.status === 'CLAIMED') {
      throw new BadRequestException('Reward already claimed');
    }
    if (reward.status === 'PENDING') {
      throw new BadRequestException('Reward not yet distributed');
    }

    reward.status = 'CLAIMED';
    const saved = await this.rewardRepo.save(reward);

    await this.redis.publish(
      'agent-economy',
      JSON.stringify({ event: 'reward_claimed', rewardId, agentId }),
    );

    return saved;
  }

  async getAgentRewards(agentId: string, rewardType?: string): Promise<AgentReward[]> {
    const where: Record<string, unknown> = { agentId };
    if (rewardType) {
      where.rewardType = rewardType;
    }
    return this.rewardRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async getEpochSummary(epoch: number): Promise<EpochSummary> {
    const rewards = await this.rewardRepo.find({ where: { epoch } });

    const byType: Record<string, { count: number; total: string }> = {};
    let totalDistributed = 0;

    for (const reward of rewards) {
      const amount = parseFloat(reward.amount);
      totalDistributed += amount;

      if (!byType[reward.rewardType]) {
        byType[reward.rewardType] = { count: 0, total: '0.000000' };
      }
      byType[reward.rewardType].count += 1;
      byType[reward.rewardType].total = (
        parseFloat(byType[reward.rewardType].total) + amount
      ).toFixed(6);
    }

    return {
      epoch,
      totalDistributed: totalDistributed.toFixed(6),
      rewardCount: rewards.length,
      byType,
    };
  }

  // ---------------------------------------------------------------------------
  // Treasury yield tracking
  // ---------------------------------------------------------------------------

  async recordYieldReward(agentId: string, amount: string, epoch: number): Promise<AgentReward> {
    const reward = this.rewardRepo.create({
      agentId,
      rewardType: 'TREASURY_YIELD',
      amount,
      epoch,
      status: 'DISTRIBUTED',
    });

    const saved = await this.rewardRepo.save(reward);

    await this.redis.publish(
      'agent-economy',
      JSON.stringify({ event: 'yield_reward_recorded', agentId, amount, epoch }),
    );

    return saved;
  }

  async getTotalYield(agentId: string): Promise<{ agentId: string; totalYield: string }> {
    const result = await this.rewardRepo
      .createQueryBuilder('r')
      .select('COALESCE(SUM(r.amount), 0)', 'total')
      .where('r.agent_id = :agentId', { agentId })
      .andWhere('r.reward_type = :type', { type: 'TREASURY_YIELD' })
      .getRawOne();

    return {
      agentId,
      totalYield: parseFloat(result?.total ?? '0').toFixed(6),
    };
  }

  // ---------------------------------------------------------------------------
  // AgentKit v2 / ERC-8004 sessions
  // ---------------------------------------------------------------------------

  async createSession(
    agentId: string,
    sessionType: string,
    walletAddress: string,
    capabilities: string[],
    maxBudget?: string,
    expiresAt?: Date,
  ): Promise<AgentKitSession> {
    const session = this.sessionRepo.create({
      agentId,
      sessionType,
      walletAddress,
      capabilities,
      maxBudget: maxBudget ?? null,
      expiresAt: expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000), // default 24h
    });

    const saved = await this.sessionRepo.save(session);

    await this.redis.publish(
      'agent-economy',
      JSON.stringify({ event: 'session_created', sessionId: saved.id, agentId, sessionType }),
    );
    this.logger.log(`Session ${saved.id} created for agent ${agentId} (${sessionType})`);

    return saved;
  }

  async getSession(sessionId: string): Promise<AgentKitSession> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }
    return session;
  }

  async listSessions(agentId?: string): Promise<AgentKitSession[]> {
    if (agentId) {
      return this.sessionRepo.find({ where: { agentId }, order: { createdAt: 'DESC' } });
    }
    return this.sessionRepo.find({ order: { createdAt: 'DESC' } });
  }

  async pauseSession(sessionId: string): Promise<AgentKitSession> {
    const session = await this.getSession(sessionId);
    if (session.status !== 'ACTIVE') {
      throw new BadRequestException(`Cannot pause session with status ${session.status}`);
    }

    session.status = 'PAUSED';
    const saved = await this.sessionRepo.save(session);

    await this.redis.publish(
      'agent-economy',
      JSON.stringify({ event: 'session_paused', sessionId }),
    );

    return saved;
  }

  async revokeSession(sessionId: string): Promise<AgentKitSession> {
    const session = await this.getSession(sessionId);
    if (session.status === 'REVOKED') {
      throw new BadRequestException('Session already revoked');
    }

    session.status = 'REVOKED';
    const saved = await this.sessionRepo.save(session);

    await this.redis.publish(
      'agent-economy',
      JSON.stringify({ event: 'session_revoked', sessionId }),
    );

    return saved;
  }

  async recordSessionSpend(sessionId: string, amount: string): Promise<AgentKitSession> {
    const session = await this.getSession(sessionId);

    if (session.status !== 'ACTIVE') {
      throw new BadRequestException(`Cannot spend on session with status ${session.status}`);
    }

    const amountNum = parseFloat(amount);
    if (amountNum <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const newSpent = parseFloat(session.spent) + amountNum;

    if (session.maxBudget !== null && newSpent > parseFloat(session.maxBudget)) {
      throw new BadRequestException('Session budget exceeded');
    }

    session.spent = newSpent.toFixed(6);
    const saved = await this.sessionRepo.save(session);

    await this.redis.publish(
      'agent-economy',
      JSON.stringify({ event: 'session_spend', sessionId, amount }),
    );

    return saved;
  }

  // ---------------------------------------------------------------------------
  // Base Ecosystem Fund integration
  // ---------------------------------------------------------------------------

  async submitPartnershipApplication(
    agentId: string,
    proposal: string,
  ): Promise<{ agentId: string; status: string; submittedAt: string }> {
    const key = `partnership:${agentId}`;
    const application = {
      agentId,
      proposal,
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
    };

    await this.redis.set(key, JSON.stringify(application));
    await this.redis.publish(
      'agent-economy',
      JSON.stringify({ event: 'partnership_submitted', agentId }),
    );

    this.logger.log(`Partnership application submitted for agent ${agentId}`);

    return {
      agentId,
      status: application.status,
      submittedAt: application.submittedAt,
    };
  }

  async getPartnershipStatus(
    agentId: string,
  ): Promise<{ agentId: string; status: string; submittedAt: string | null }> {
    const key = `partnership:${agentId}`;
    const cached = await this.redis.get(key);

    if (!cached) {
      return { agentId, status: 'NONE', submittedAt: null };
    }

    const parsed = JSON.parse(cached);
    return {
      agentId,
      status: parsed.status,
      submittedAt: parsed.submittedAt,
    };
  }
}
