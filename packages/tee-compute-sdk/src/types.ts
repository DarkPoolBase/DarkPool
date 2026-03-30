export interface TeeClientConfig {
  baseUrl: string;
  apiKey?: string;
  token?: string;
}

export interface SubmitJobParams {
  container: string;
  encryptedInput: string; // base64
  gpuType: string;
  maxDuration?: number; // seconds, default 3600
}

export interface TeeJob {
  id: string;
  userId: string;
  container: string;
  gpuType: string;
  maxDuration: number;
  status: 'PENDING' | 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  nodeId: string | null;
  proofHash: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface TeeJobResult {
  jobId: string;
  encryptedResult: string;
  proofHash: string;
  completedAt: string;
}

export interface TeeNode {
  id: string;
  nodeAddress: string;
  enclaveId: string;
  gpuTypes: Array<{ type: string; count: number; available: number }>;
  region: string;
  status: string;
  totalJobsCompleted: number;
  uptimePct: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
