export const ORDER_CONSTANTS = {
  MIN_PRICE: 0.001,
  MAX_PRICE: 100,
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 1000,
  MIN_DURATION: 1,
  MAX_DURATION: 720, // 30 days in hours
  COMMITMENT_HASH_REGEX: /^0x[a-fA-F0-9]{64}$/,
  REDIS_CHANNEL: 'adp:events:order',
} as const;

