const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private apiKey: string | null = null;
  private refreshing: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  /** Check if the current JWT is expired or expires within 60s */
  isTokenExpired(): boolean {
    if (!this.token) return true;
    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      return payload.exp * 1000 < Date.now() + 60_000;
    } catch {
      return true;
    }
  }

  /** Attempt to refresh the access token using the stored refresh token */
  async tryRefreshToken(): Promise<boolean> {
    // Deduplicate concurrent refresh attempts
    if (this.refreshing) return this.refreshing;

    this.refreshing = (async () => {
      const refreshToken = localStorage.getItem('adp_refresh_token');
      if (!refreshToken) return false;
      try {
        const res = await fetch(`${this.baseUrl}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        if (data.accessToken) {
          this.token = data.accessToken;
          localStorage.setItem('adp_access_token', data.accessToken);
          if (data.refreshToken) {
            localStorage.setItem('adp_refresh_token', data.refreshToken);
          }
          return true;
        }
        return false;
      } catch {
        return false;
      }
    })();

    try {
      return await this.refreshing;
    } finally {
      this.refreshing = null;
    }
  }

  /** Ensure token is valid before making a request — refresh if needed */
  private async ensureAuth(): Promise<void> {
    if (this.token && this.isTokenExpired()) {
      const refreshed = await this.tryRefreshToken();
      if (!refreshed) {
        // Clear stale tokens so useAuth re-triggers login
        localStorage.removeItem('adp_access_token');
        localStorage.removeItem('adp_refresh_token');
        this.token = null;
      }
    }
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

  /** Make a request, retry once on 401 after refreshing token */
  private async request<T>(method: string, path: string, options?: RequestOptions & { body?: string }): Promise<T> {
    await this.ensureAuth();

    const makeRequest = async () => {
      const url = new URL(`${this.baseUrl}${path}`);
      if (options?.params) {
        Object.entries(options.params).forEach(([k, v]) => url.searchParams.set(k, v));
      }
      return fetch(url.toString(), {
        ...options,
        method,
        headers: this.getHeaders(),
        body: options?.body,
      });
    };

    let res = await makeRequest();

    // On 401, try refreshing once and retry
    if (res.status === 401 && this.token) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        res = await makeRequest();
      }
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `API error: ${res.status}`);
    }
    return res.json();
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, { body: body ? JSON.stringify(body) : undefined });
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, { body: body ? JSON.stringify(body) : undefined });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}

export const api = new ApiClient(API_BASE_URL);

