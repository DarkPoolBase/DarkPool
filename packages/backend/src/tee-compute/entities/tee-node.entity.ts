import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tee_nodes')
export class TeeNode {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'node_address', type: 'varchar', length: 42, unique: true })
  nodeAddress!: string;

  @Column({ name: 'enclave_id', type: 'varchar', length: 66 })
  enclaveId!: string;

  @Column({ name: 'gpu_types', type: 'jsonb' })
  gpuTypes!: Array<{ type: string; count: number; available: number }>;

  @Column({ type: 'varchar', length: 20, default: 'us-east-1' })
  region!: string;

  @Column({ name: 'max_concurrent_jobs', type: 'int', default: 4 })
  maxConcurrentJobs!: number;

  @Column({ name: 'current_jobs', type: 'int', default: 0 })
  currentJobs!: number;

  @Column({ type: 'varchar', length: 10, default: 'ACTIVE' })
  status!: string;

  @Column({ name: 'last_heartbeat', type: 'timestamp' })
  lastHeartbeat!: Date;

  @Column({ name: 'total_jobs_completed', type: 'int', default: 0 })
  totalJobsCompleted!: number;

  @Column({ name: 'uptime_pct', type: 'decimal', precision: 5, scale: 2, default: 100 })
  uptimePct!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
