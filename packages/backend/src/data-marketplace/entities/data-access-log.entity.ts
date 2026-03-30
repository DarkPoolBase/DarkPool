import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('data_access_logs')
export class DataAccessLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'listing_id', type: 'uuid' })
  listingId!: string;

  @Column({ name: 'accessor_wallet', type: 'varchar', length: 42 })
  accessorWallet!: string;

  @Column({ name: 'payment_amount', type: 'decimal', precision: 18, scale: 6 })
  paymentAmount!: string;

  @Column({ name: 'tx_hash', type: 'varchar', length: 66, nullable: true })
  txHash!: string | null;

  @Column({ name: 'access_token_id', type: 'int', nullable: true })
  accessTokenId!: number | null;

  @CreateDateColumn({ name: 'accessed_at' })
  accessedAt!: Date;
}
