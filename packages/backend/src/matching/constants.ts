export const MATCHING_CONSTANTS = {
  BATCH_INTERVAL_MS: 45_000,
  LOCK_KEY: 'adp:matching:lock',
  LOCK_TTL: 30,
  BATCH_COUNTER_KEY: 'adp:matching:batchId',
  PROTOCOL_FEE_BPS: 80,
  BPS_DENOMINATOR: 10_000,
  MIN_ORDERS_FOR_AUCTION: 2,
  GPU_TYPES: ['H100', 'A100', 'RTX4090', 'L40S', 'H200', 'A10G'],
  REDIS_CHANNEL: 'adp:events:batch',
} as const;
