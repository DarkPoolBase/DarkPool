import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('validators')
export class Validator {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'wallet_address', type: 'varchar', length: 42, unique: true })
  walletAddress!: string;

  @Column({ name: 'stake_amount', type: 'decimal', precision: 18, scale: 6, default: 0 })
  stakeAmount!: string;

  @Column({ name: 'total_validations', type: 'int', default: 0 })
  totalValidations!: number;

  @Column({ name: 'correct_validations', type: 'int', default: 0 })
  correctValidations!: number;

  @Column({ name: 'total_earned', type: 'decimal', precision: 18, scale: 6, default: 0 })
  totalEarned!: string;

  @Column({ name: 'performance_score', type: 'decimal', precision: 5, scale: 2, default: 100 })
  performanceScore!: number;

  @Column({ type: 'varchar', length: 10, default: 'ACTIVE' })
  status!: string;

  @CreateDateColumn({ name: 'registered_at' })
  registeredAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
