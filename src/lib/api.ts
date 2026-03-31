const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private apiKey: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }
    return headers;
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (options?.params) {
      Object.entries(options.params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const res = await fetch(url.toString(), {
      ...options,
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  async delete<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }
}

export const api = new ApiClient(API_BASE_URL);

