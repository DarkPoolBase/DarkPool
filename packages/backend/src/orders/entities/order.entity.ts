import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId!: string;

  @Column({ name: 'wallet_address', type: 'varchar', length: 42 })
  walletAddress!: string;

  @Column({ type: 'varchar', length: 4 })
  side!: string; // BUY or SELL

  @Column({ name: 'gpu_type', type: 'varchar', length: 20 })
  @Index()
  gpuType!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ name: 'price_per_hour', type: 'decimal', precision: 18, scale: 6 })
  pricePerHour!: string;

  @Column({ type: 'int' })
  duration!: number; // hours

  @Column({ name: 'escrow_amount', type: 'decimal', precision: 18, scale: 6 })
  escrowAmount!: string;

  @Column({ name: 'commitment_hash', type: 'varchar', length: 66 })
  commitmentHash!: string;

  @Column({ name: 'encrypted_details', type: 'text', nullable: true })
  encryptedDetails!: string | null;

  @Column({ type: 'varchar', length: 10, default: 'ACTIVE' })
  @Index()
  status!: string; // PENDING, ACTIVE, FILLED, CANCELLED, EXPIRED

  @Column({ name: 'batch_id', type: 'int', nullable: true })
  batchId!: number | null;

  @Column({ name: 'clearing_price', type: 'decimal', precision: 18, scale: 6, nullable: true })
  clearingPrice!: string | null;

  @Column({ name: 'tx_hash', type: 'varchar', length: 66, nullable: true })
  txHash!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

