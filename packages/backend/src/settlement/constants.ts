export const SETTLEMENT_CONSTANTS = {
  MAX_RETRIES: 3,
  RETRY_BASE_DELAY_MS: 2000,
  REDIS_BATCH_CHANNEL: 'adp:events:batch',
  REDIS_SETTLEMENT_CHANNEL: 'adp:events:settlement',
  SIMULATED_TX_PREFIX: '0x',
} as const;
