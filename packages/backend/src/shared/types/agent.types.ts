export interface AgentIdentity {
  id: string;
  walletAddress: string;
  capabilities: string[];
  reputationScore: number;
  creditScore: number;
  registeredAt: string;
}

export interface AgentTask {
  id: string;
  agentId: string;
  taskType: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  proofHash?: string;
  createdAt: string;
  completedAt?: string;
}
