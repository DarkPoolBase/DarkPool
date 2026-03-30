import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('agent_treasuries')
export class AgentTreasury {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ name: 'agent_id', type: 'varchar', length: 66 })
  agentId!: string;

  @Column({ name: 'owner_address', type: 'varchar', length: 42 })
  ownerAddress!: string;

  @Column({ name: 'treasury_address', type: 'varchar', length: 42 })
  treasuryAddress!: string;

  @Column({ type: 'decimal', precision: 18, scale: 6, default: 0 })
  balance!: string;

  @Column({ name: 'total_deposited', type: 'decimal', precision: 18, scale: 6, default: 0 })
  totalDeposited!: string;

  @Column({ name: 'total_withdrawn', type: 'decimal', precision: 18, scale: 6, default: 0 })
  totalWithdrawn!: string;

  @Column({ name: 'total_spent', type: 'decimal', precision: 18, scale: 6, default: 0 })
  totalSpent!: string;

  @Column({ name: 'daily_spend_limit', type: 'decimal', precision: 18, scale: 6, default: 1000 })
  dailySpendLimit!: string;

  @Column({ name: 'monthly_spend_limit', type: 'decimal', precision: 18, scale: 6, default: 25000 })
  monthlySpendLimit!: string;

  @Column({ name: 'approval_threshold', type: 'decimal', precision: 18, scale: 6, default: 5000 })
  approvalThreshold!: string;

  @Column({ name: 'yield_strategy', type: 'varchar', length: 20, default: 'NONE' })
  yieldStrategy!: string;

  @Column({ name: 'allocated_to_yield', type: 'decimal', precision: 18, scale: 6, default: 0 })
  allocatedToYield!: string;

  @Column({ type: 'varchar', length: 10, default: 'ACTIVE' })
  status!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
