import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('indexed_events')
export class IndexedEvent {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ name: 'block_number', type: 'bigint' })
  blockNumber!: string;

  @Column({ name: 'tx_hash', type: 'varchar', length: 66 })
  txHash!: string;

  @Column({ name: 'log_index', type: 'int' })
  logIndex!: number;

  @Index()
  @Column({ name: 'contract_address', type: 'varchar', length: 42 })
  contractAddress!: string;

  @Index()
  @Column({ name: 'event_name', type: 'varchar', length: 64 })
  eventName!: string;

  @Column({ type: 'jsonb' })
  args!: Record<string, unknown>;

  @CreateDateColumn({ name: 'indexed_at' })
  indexedAt!: Date;
}
