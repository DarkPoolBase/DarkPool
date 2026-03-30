import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('settlements')
export class Settlement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ name: 'batch_id', type: 'int' })
  batchId!: number;

  @Column({ name: 'clearing_price', type: 'decimal', precision: 18, scale: 6 })
  clearingPrice!: string;

  @Column({ name: 'total_volume', type: 'decimal', precision: 18, scale: 6 })
  totalVolume!: string;

  @Column({ name: 'num_fills', type: 'int' })
  numFills!: number;

  @Column({ name: 'protocol_fee', type: 'decimal', precision: 18, scale: 6 })
  protocolFee!: string;

  @Column({ name: 'tx_hash', type: 'varchar', length: 66, nullable: true })
  txHash!: string | null;

  @Column({ name: 'block_number', type: 'bigint', nullable: true })
  blockNumber!: string | null;

  @Column({ name: 'settled_at', type: 'timestamptz', nullable: true })
  settledAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
