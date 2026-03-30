import {
  TeeClientConfig,
  SubmitJobParams,
  TeeJob,
  TeeJobResult,
  TeeNode,
  PaginatedResponse,
} from './types';

export class TeeClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: TeeClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.headers = { 'Content-Type': 'application/json' };
    if (config.apiKey) this.headers['X-API-Key'] = config.apiKey;
    if (config.token) this.headers['Authorization'] = `Bearer ${config.token}`;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(`TeeClient error ${res.status}: ${err.message || res.statusText}`);
    }
    return res.json();
  }

  async submit(params: SubmitJobParams): Promise<TeeJob> {
    return this.request<TeeJob>('POST', '/api/tee-compute/jobs', params);
  }

  async getStatus(jobId: string): Promise<TeeJob> {
    return this.request<TeeJob>('GET', `/api/tee-compute/jobs/${jobId}`);
  }

  async getResult(jobId: string): Promise<TeeJobResult> {
    return this.request<TeeJobResult>('GET', `/api/tee-compute/jobs/${jobId}/result`);
  }

  async cancel(jobId: string): Promise<TeeJob> {
    return this.request<TeeJob>('DELETE', `/api/tee-compute/jobs/${jobId}`);
  }

  async listJobs(page = 1, limit = 20): Promise<PaginatedResponse<TeeJob>> {
    return this.request<PaginatedResponse<TeeJob>>(
      'GET',
      `/api/tee-compute/jobs?page=${page}&limit=${limit}`,
    );
  }

  async listNodes(): Promise<TeeNode[]> {
    return this.request<TeeNode[]>('GET', '/api/tee-compute/nodes');
  }

  async pollUntilComplete(
    jobId: string,
    intervalMs = 2000,
    timeoutMs = 600000,
  ): Promise<TeeJobResult> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const job = await this.getStatus(jobId);
      if (job.status === 'COMPLETED') return this.getResult(jobId);
      if (job.status === 'FAILED') throw new Error(`Job failed: ${job.errorMessage}`);
      if (job.status === 'CANCELLED') throw new Error('Job was cancelled');
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    throw new Error('Job polling timed out');
  }
}
