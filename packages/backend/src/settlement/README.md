# Settlement Service

Processes matched batch results, creates settlement records, updates order statuses, and publishes events for WebSocket broadcast.

## How It Works

1. **Subscribe** — Listens to `batch:completed` events from Matching Engine via Redis
2. **Submit** — Submits settlement on-chain (V1: simulated, V2: real contract call)
3. **Record** — Creates Settlement record in PostgreSQL (idempotent via batch_id unique)
4. **Fill** — Bulk updates matched orders to FILLED status
5. **Broadcast** — Publishes `batch:settled` event for WebSocket relay

## Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/settlements` | List recent settlements | Public |
| GET | `/api/settlements/:batchId` | Single settlement | Public |

## V2 Upgrade Path

Replace `submitOnChain()` with actual viem contract call:
1. Sign settlement hash with relayer private key (ECDSA)
2. Call `DarkPool.settleBatch(settlement, signature)` on Base
3. Wait for tx confirmation
4. Store real tx hash in settlement record
