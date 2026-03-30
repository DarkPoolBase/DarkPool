export interface InferenceJobDto {
  modelId: string;
  encryptedInput: string;
  maxLatencyMs: number;
  maxPricePerToken: number;
}

export interface ModelRegistryEntry {
  id: string;
  name: string;
  version: string;
  inputSchema: string;
  outputSchema: string;
  requiredGpuType: string;
  benchmarkScore: number;
  pricePerToken: number;
  provider: string;
}

export interface InferenceResult {
  jobId: string;
  encryptedOutput: string;
  executionProof: string;
  latencyMs: number;
  tokensUsed: number;
  totalCost: number;
}
