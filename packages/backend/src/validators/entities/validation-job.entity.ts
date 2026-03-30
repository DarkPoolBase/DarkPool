import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('validation_jobs')
export class ValidationJob {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'job_id', type: 'varchar', length: 66 })
  jobId!: string;

  @Column({ name: 'model_id', type: 'int' })
  modelId!: number;

  @Column({ name: 'proof_hash', type: 'varchar', length: 66 })
  proofHash!: string;

  @Column({ name: 'assigned_validators', type: 'jsonb' })
  assignedValidators!: string[];

  @Column({ type: 'jsonb', default: '{}' })
  votes!: Record<string, boolean>;

  @Column({ name: 'consensus_reached', type: 'boolean', default: false })
  consensusReached!: boolean;

  @Column({ name: 'consensus_result', type: 'boolean', nullable: true })
  consensusResult!: boolean | null;

  @Column({ name: 'fee_amount', type: 'decimal', precision: 18, scale: 6 })
  feeAmount!: string;

  @Column({ type: 'varchar', length: 12, default: 'PENDING' })
  status!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
