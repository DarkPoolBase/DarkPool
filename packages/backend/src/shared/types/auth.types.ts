export interface AuthUser {
  id: string;
  walletAddress: string;
  subscriptionTier: 'FREE' | 'PRO' | 'ENTERPRISE';
}

export interface ApiKeyResponse {
  id: string;
  prefix: string;
  environment: 'LIVE' | 'TEST';
  key?: string; // Only returned on creation
  createdAt: string;
  lastUsedAt?: string;
}

export interface NonceResponse {
  nonce: string;
  expiresAt: string;
}

export interface VerifyRequest {
  address: string;
  signature: string;
  nonce: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
