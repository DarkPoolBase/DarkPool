import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('compliance_proofs')
export class ComplianceProof {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId!: string;

  @Column({ name: 'proof_type', type: 'varchar', length: 20 })
  proofType!: string; // 'AML' | 'KYC' | 'TAX'

  @Column({ type: 'varchar', length: 10 })
  jurisdiction!: string; // 'EU' | 'US' | 'SG' | 'GLOBAL'

  @Column({ name: 'proof_hash', type: 'varchar', length: 66 })
  proofHash!: string;

  @Column({ name: 'public_inputs_hash', type: 'varchar', length: 66 })
  publicInputsHash!: string;

  @Column({ type: 'varchar', length: 12, default: 'PENDING' })
  status!: string; // PENDING | VERIFIED | REJECTED | EXPIRED

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt!: Date | null;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt!: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
