import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('treasury_transactions')
export class TreasuryTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'treasury_id', type: 'varchar', length: 36 })
  treasuryId!: string;

  @Column({ type: 'varchar', length: 15 })
  type!: string;

  @Column({ type: 'decimal', precision: 18, scale: 6 })
  amount!: string;

  @Column({ type: 'varchar', length: 42, nullable: true })
  recipient!: string | null;

  @Column({ name: 'tx_hash', type: 'varchar', length: 66, nullable: true })
  txHash!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'requires_approval', type: 'boolean', default: false })
  requiresApproval!: boolean;

  @Column({ type: 'boolean', nullable: true })
  approved!: boolean | null;

  @Column({ name: 'approved_by', type: 'varchar', length: 42, nullable: true })
  approvedBy!: string | null;

  @Column({ type: 'varchar', length: 12, default: 'PENDING' })
  status!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
