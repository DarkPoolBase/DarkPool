/** Supported ZK proof types in the Agentic Dark Pool */
export enum ProofType {
  Balance = 'Balance',
  Order = 'Order',
  Identity = 'Identity',
  Dataset = 'Dataset',
}

/** Inputs for the Private Balance Proof circuit */
export interface BalanceProofInputs {
  /** Hash commitment of the balance (public) */
  balanceHash: string;
  /** Minimum required balance (public) */
  threshold: bigint;
  /** Actual balance value (private) */
  balance: bigint;
  /** Preimage values that hash to balanceHash (private) */
  balancePreimage: [string, string, string, string];
  /** Random salt for commitment hiding (private) */
  salt: string;
}

/** Inputs for the Private Order Commitment circuit */
export interface OrderProofInputs {
  /** Hash commitment of the full order (public) */
  commitmentHash: string;
  /** GPU type being traded (public) */
  gpuType: bigint;
  /** Minimum acceptable fill quantity (public) */
  minQuantity: bigint;
  /** Order side: 0 = buy, 1 = sell (private) */
  side: 0 | 1;
  /** Limit price for the order (private) */
  price: bigint;
  /** Total order quantity (private) */
  quantity: bigint;
  /** Unique order nonce for replay protection (private) */
  nonce: string;
  /** Preimage values that hash to commitmentHash (private) */
  orderPreimage: [string, string, string, string];
}

/** Inputs for the Private Identity Verification circuit */
export interface IdentityProofInputs {
  /** Merkle root / hash of the full identity record (public) */
  identityRoot: string;
  /** KYC status, must be 1 for passed (public) */
  kycStatus: 1;
  /** Numeric jurisdiction code (public) */
  jurisdiction: bigint;
  /** Hash of participant's legal name (private) */
  nameHash: string;
  /** Hash of the identity document (private) */
  documentHash: string;
  /** Hash of the KYC issuer/provider (private) */
  issuerHash: string;
  /** Unix timestamp when the KYC verification expires (private) */
  expiryTimestamp: bigint;
  /** Preimage values that hash to identityRoot (private) */
  identityPreimage: [string, string, string, string];
}

/** Inputs for the Private Dataset Proof circuit */
export interface DatasetProofInputs {
  /** Hash commitment of the dataset metadata (public) */
  datasetHash: string;
  /** Minimum required dataset size in GB (public) */
  minSizeGb: bigint;
  /** Minimum quality score 0-100 (public) */
  minQualityScore: bigint;
  /** Required data format identifier (public) */
  requiredFormat: bigint;
  /** Actual dataset size in GB (private) */
  actualSizeGb: bigint;
  /** Actual quality score (private) */
  qualityScore: bigint;
  /** Actual format identifier (private) */
  formatId: bigint;
  /** Number of records in the dataset (private) */
  recordCount: bigint;
  /** Preimage values that hash to datasetHash (private) */
  datasetPreimage: [string, string, string, string];
}

/** Result of an on-chain proof verification */
export interface VerificationResult {
  proofType: ProofType;
  verified: boolean;
  publicInputsHash: string;
  timestamp: bigint;
}
