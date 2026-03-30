# Orders Module

Core trading module for the Agentic Dark Pool. Handles order submission, validation, cancellation, and status tracking.

## Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/orders` | Submit encrypted order | JWT |
| GET | `/api/orders` | List user's orders (filtered, paginated) | JWT |
| GET | `/api/orders/stats` | Order count by status | JWT |
| GET | `/api/orders/:id` | Single order detail | JWT |
| DELETE | `/api/orders/:id` | Cancel active order | JWT |

## Validation Rules

- **side**: BUY or SELL
- **gpuType**: H100, A100, RTX4090, L40S, H200, A10G
- **quantity**: 1–1,000
- **pricePerHour**: 0.001–100 USDC
- **duration**: 1–720 hours
- **commitmentHash**: Must match `0x[64 hex chars]`

## Escrow Calculation

```
escrowAmount = quantity × pricePerHour × duration
```

## Events Published

Channel: `adp:events:order`

- `order:status` — On create/cancel (includes userId for WebSocket routing)
- `order:filled` — On batch settlement (includes clearingPrice, batchId)

## Exported Methods (for Matching Engine / Settlement)

- `getActiveOrdersByGpuType(gpuType)` — Fetch ACTIVE orders for batch auction
- `fillOrders(orderIds, batchId, clearingPrice, txHash)` — Bulk FILLED update
- `countByStatus(userId)` — Dashboard stats
