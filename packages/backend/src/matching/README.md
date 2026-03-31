# Matching Engine

Batch auction matching engine for the Agentic Dark Pool. Runs every 45 seconds, finding the uniform clearing price that maximizes matched volume for each GPU type.

## How It Works

1. **Collect** — ACTIVE orders accumulate in the database
2. **Lock** — Redis distributed lock prevents concurrent runs
3. **Build** — Order book constructed per GPU type (bids desc, asks asc)
4. **Clear** — Find price where demand meets supply
5. **Match** — Pair eligible buyers with sellers at clearing price
6. **Publish** — Emit batch:completed event for Settlement Service

## Algorithm

Uniform price batch auction (same model as CoW Swap):
- All matched trades execute at the same clearing price
- Buyers who bid >= clearing price get filled
- Sellers who ask <= clearing price get filled
- Volume-maximizing: clearing price chosen to maximize total GPU-hours traded

## Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/matching/trigger` | Manual batch trigger | Admin only |

## Redis Events Published

- `adp:events:batch` → `batch:phase` (COLLECTING, MATCHING)
- `adp:events:batch` → `batch:completed` (triggers Settlement Service)
