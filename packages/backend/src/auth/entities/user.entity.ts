import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiKey } from './api-key.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'wallet_address', type: 'varchar', length: 42, unique: true })
  walletAddress!: string;

  @Column({ type: 'varchar', length: 64 })
  nonce!: string;

  @Column({ type: 'varchar', length: 10, default: 'TRADER' })
  role!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => ApiKey, (key) => key.user)
  apiKeys!: ApiKey[];
}
