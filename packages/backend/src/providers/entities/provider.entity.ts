import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('providers')
export class Provider {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'gpu_types', type: 'jsonb' })
  gpuTypes!: { type: string; count: number; available: number }[];

  @Column({ type: 'varchar', length: 32, nullable: true })
  region!: string | null;

  @Column({ name: 'uptime_pct', type: 'decimal', precision: 5, scale: 2, default: 100.0 })
  uptimePct!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100.0 })
  reputation!: number;

  @Column({ name: 'total_jobs', type: 'int', default: 0 })
  totalJobs!: number;

  @Column({ type: 'varchar', length: 10, default: 'ACTIVE' })
  status!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
