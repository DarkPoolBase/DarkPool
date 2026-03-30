import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('data_listings')
export class DataListing {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'provider_id', type: 'uuid' })
  providerId!: string;

  @Column({ name: 'provider_wallet', type: 'varchar', length: 42 })
  providerWallet!: string;

  @Index()
  @Column({ type: 'varchar', length: 32 })
  category!: string;

  @Column({ type: 'varchar', length: 16 })
  format!: string;

  @Column({ name: 'size_gb', type: 'decimal', precision: 10, scale: 2 })
  sizeGb!: string;

  @Column({ name: 'metadata_hash', type: 'varchar', length: 66 })
  metadataHash!: string;

  @Column({ name: 'quality_score', type: 'int' })
  qualityScore!: number;

  @Column({ name: 'price_per_access', type: 'decimal', precision: 18, scale: 6 })
  pricePerAccess!: string;

  @Column({ name: 'privacy_proof', type: 'text', nullable: true })
  privacyProof!: string | null;

  @Column({ name: 'token_id', type: 'int', nullable: true })
  tokenId!: number | null;

  @Column({ name: 'access_count', type: 'int', default: 0 })
  accessCount!: number;

  @Column({ type: 'varchar', length: 10, default: 'ACTIVE' })
  status!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  tags!: string[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
