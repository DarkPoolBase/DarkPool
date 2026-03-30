import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('compliance_configs')
export class ComplianceConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 10, unique: true })
  jurisdiction!: string;

  @Column({ name: 'aml_required', type: 'boolean', default: true })
  amlRequired!: boolean;

  @Column({ name: 'kyc_required', type: 'boolean', default: true })
  kycRequired!: boolean;

  @Column({ name: 'tax_reporting_required', type: 'boolean', default: false })
  taxReportingRequired!: boolean;

  @Column({ name: 'max_transaction_value', type: 'decimal', precision: 18, scale: 6, nullable: true })
  maxTransactionValue!: string | null;

  @Column({ name: 'proof_expiry_days', type: 'int', default: 365 })
  proofExpiryDays!: number;

  @Column({ type: 'jsonb' })
  regulations!: Record<string, unknown>;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
