import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tee_jobs')
export class TeeJob {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId!: string;

  @Column({ type: 'varchar', length: 255 })
  container!: string;

  @Column({ name: 'encrypted_input', type: 'text' })
  encryptedInput!: string;

  @Column({ name: 'gpu_type', type: 'varchar', length: 20 })
  gpuType!: string;

  @Column({ name: 'max_duration', type: 'int', default: 3600 })
  maxDuration!: number;

  @Column({ type: 'varchar', length: 12, default: 'PENDING' })
  status!: string;

  @Column({ name: 'node_id', type: 'varchar', length: 66, nullable: true })
  nodeId!: string | null;

  @Column({ name: 'encrypted_result', type: 'text', nullable: true })
  encryptedResult!: string | null;

  @Column({ name: 'proof_hash', type: 'varchar', length: 66, nullable: true })
  proofHash!: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
