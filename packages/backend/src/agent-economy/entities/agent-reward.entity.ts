import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('agent_rewards')
export class AgentReward {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'agent_id', type: 'varchar', length: 66 })
  agentId!: string;

  @Column({ name: 'reward_type', type: 'varchar', length: 20 })
  rewardType!: string; // REPUTATION_MINING | TREASURY_YIELD | TASK_COMPLETION

  @Column({ type: 'decimal', precision: 18, scale: 6 })
  amount!: string;

  @Column({ name: 'tx_hash', type: 'varchar', length: 66, nullable: true })
  txHash!: string | null;

  @Index()
  @Column({ type: 'int' })
  epoch!: number;

  @Column({ type: 'varchar', length: 10, default: 'PENDING' })
  status!: string; // PENDING | DISTRIBUTED | CLAIMED

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
