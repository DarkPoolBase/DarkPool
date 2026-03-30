/**
 * Redis channels used by the Orders module
 */
export const ORDERS_REDIS_CHANNELS = {
  ORDER_EVENTS: 'adp:events:order',
  BATCH_EVENTS: 'adp:events:batch',
} as const;

/**
 * Order event types published to Redis
 */
export const ORDER_EVENT_TYPES = {
  STATUS_CHANGED: 'order:status',
  FILLED: 'order:filled',
  CANCELLED: 'order:cancelled',
} as const;

/**
 * Order expiry configuration
 */
export const ORDER_EXPIRY = {
  DEFAULT_TTL_HOURS: 168, // 7 days
  CHECK_INTERVAL_MS: 60000, // 1 minute
} as const;
