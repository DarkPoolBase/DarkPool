import { ProofType } from './types';

/** Metadata describing a ZK circuit template */
export interface CircuitMetadata {
  /** Proof type identifier */
  proofType: ProofType;
  /** Noir circuit name (matches Nargo.toml package name) */
  circuitName: string;
  /** Human-readable description */
  description: string;
  /** List of public input field names and descriptions */
  publicInputs: Array<{ name: string; type: string; description: string }>;
  /** List of private input field names and descriptions */
  privateInputs: Array<{ name: string; type: string; description: string }>;
}

/** Static registry of all ZK proof circuit templates */
export class ZKTemplates {
  /** Get metadata for the Private Balance Proof circuit */
  static balanceProof(): CircuitMetadata {
    return {
      proofType: ProofType.Balance,
      circuitName: 'private_balance',
      description: 'Proves balance >= threshold without revealing exact amount',
      publicInputs: [
        { name: 'balance_hash', type: 'Field', description: 'Hash commitment of the balance' },
        { name: 'threshold', type: 'u64', description: 'Minimum required balance' },
      ],
      privateInputs: [
        { name: 'balance', type: 'u64', description: 'Actual balance value' },
        { name: 'balance_preimage', type: 'Field[4]', description: 'Preimage values for hash commitment' },
        { name: 'salt', type: 'Field', description: 'Random salt for commitment hiding' },
      ],
    };
  }

  /** Get metadata for the Private Order Commitment circuit */
  static orderProof(): CircuitMetadata {
    return {
      proofType: ProofType.Order,
      circuitName: 'private_order',
      description: 'Commits to order params without revealing side/price/quantity',
      publicInputs: [
        { name: 'commitment_hash', type: 'Field', description: 'Hash commitment of the full order' },
        { name: 'gpu_type', type: 'u64', description: 'GPU type being traded' },
        { name: 'min_quantity', type: 'u64', description: 'Minimum acceptable fill quantity' },
      ],
      privateInputs: [
        { name: 'side', type: 'u64', description: 'Order side: 0 = buy, 1 = sell' },
        { name: 'price', type: 'u64', description: 'Limit price for the order' },
        { name: 'quantity', type: 'u64', description: 'Total order quantity' },
        { name: 'nonce', type: 'Field', description: 'Unique nonce for replay protection' },
        { name: 'order_preimage', type: 'Field[4]', description: 'Preimage values for hash commitment' },
      ],
    };
  }

  /** Get metadata for the Private Identity Verification circuit */
  static identityProof(): CircuitMetadata {
    return {
      proofType: ProofType.Identity,
      circuitName: 'private_identity',
      description: 'Proves KYC status without revealing PII',
      publicInputs: [
        { name: 'identity_root', type: 'Field', description: 'Hash of the full identity record' },
        { name: 'kyc_status', type: 'u64', description: 'KYC verification status (1 = passed)' },
        { name: 'jurisdiction', type: 'u64', description: 'Numeric jurisdiction code' },
      ],
      privateInputs: [
        { name: 'name_hash', type: 'Field', description: 'Hash of participant legal name' },
        { name: 'document_hash', type: 'Field', description: 'Hash of identity document' },
        { name: 'issuer_hash', type: 'Field', description: 'Hash of KYC issuer/provider' },
        { name: 'expiry_timestamp', type: 'u64', description: 'KYC expiry unix timestamp' },
        { name: 'identity_preimage', type: 'Field[4]', description: 'Preimage values for hash commitment' },
      ],
    };
  }

  /** Get metadata for the Private Dataset Proof circuit */
  static datasetProof(): CircuitMetadata {
    return {
      proofType: ProofType.Dataset,
      circuitName: 'private_dataset',
      description: 'Proves dataset properties without revealing contents',
      publicInputs: [
        { name: 'dataset_hash', type: 'Field', description: 'Hash commitment of dataset metadata' },
        { name: 'min_size_gb', type: 'u64', description: 'Minimum required dataset size in GB' },
        { name: 'min_quality_score', type: 'u64', description: 'Minimum quality score (0-100)' },
        { name: 'required_format', type: 'u64', description: 'Required data format identifier' },
      ],
      privateInputs: [
        { name: 'actual_size_gb', type: 'u64', description: 'Actual dataset size in GB' },
        { name: 'quality_score', type: 'u64', description: 'Actual quality score' },
        { name: 'format_id', type: 'u64', description: 'Actual format identifier' },
        { name: 'record_count', type: 'u64', description: 'Number of records in dataset' },
        { name: 'dataset_preimage', type: 'Field[4]', description: 'Preimage values for hash commitment' },
      ],
    };
  }

  /** Get metadata for all available circuit templates */
  static all(): CircuitMetadata[] {
    return [
      ZKTemplates.balanceProof(),
      ZKTemplates.orderProof(),
      ZKTemplates.identityProof(),
      ZKTemplates.datasetProof(),
    ];
  }

  /** Get metadata by proof type */
  static byType(proofType: ProofType): CircuitMetadata {
    switch (proofType) {
      case ProofType.Balance:
        return ZKTemplates.balanceProof();
      case ProofType.Order:
        return ZKTemplates.orderProof();
      case ProofType.Identity:
        return ZKTemplates.identityProof();
      case ProofType.Dataset:
        return ZKTemplates.datasetProof();
    }
  }
}
