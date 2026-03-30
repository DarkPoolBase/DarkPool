import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('agent_kit_sessions')
export class AgentKitSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'agent_id', type: 'varchar', length: 66 })
  agentId!: string;

  @Column({ name: 'session_type', type: 'varchar', length: 20 })
  sessionType!: string; // AGENTKIT_V2 | ERC_8004 | AUTONOMOUS

  @Column({ name: 'wallet_address', type: 'varchar', length: 42 })
  walletAddress!: string;

  @Column({ type: 'jsonb', default: '[]' })
  capabilities!: string[]; // e.g. ['trade', 'treasury', 'governance']

  @Column({ name: 'max_budget', type: 'decimal', precision: 18, scale: 6, nullable: true })
  maxBudget!: string | null;

  @Column({ type: 'decimal', precision: 18, scale: 6, default: 0 })
  spent!: string;

  @Column({ type: 'varchar', length: 10, default: 'ACTIVE' })
  status!: string; // ACTIVE | PAUSED | EXPIRED | REVOKED

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
