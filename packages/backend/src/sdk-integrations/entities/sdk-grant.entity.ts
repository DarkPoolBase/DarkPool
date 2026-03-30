import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sdk_grants')
export class SdkGrant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'applicant_address', type: 'varchar', length: 42 })
  applicantAddress!: string;

  @Column({ name: 'project_name', type: 'varchar', length: 100 })
  projectName!: string;

  @Column({ name: 'project_description', type: 'text' })
  projectDescription!: string;

  @Column({ name: 'grant_amount', type: 'decimal', precision: 18, scale: 6 })
  grantAmount!: string;

  @Column({ type: 'varchar', length: 12, default: 'PENDING' })
  status!: string; // PENDING | APPROVED | REJECTED | DISBURSED

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt!: Date | null;

  @Column({ name: 'disbursed_at', type: 'timestamp', nullable: true })
  disbursedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
