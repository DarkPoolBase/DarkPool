# Settlement Service Changelog

## v1.0.0 (2026-03-30)

### Added
- Redis subscriber for batch:completed events
- Settlement record creation (idempotent via batch_id unique)
- Bulk order FILLED status update
- Exponential backoff retry (max 3 attempts)
- Simulated on-chain settlement (V1)
- Settlement event broadcasting to WebSocket
- GET /api/settlements — recent settlements
- GET /api/settlements/:batchId — single settlement lookup
- SettlementMonitorService for 24h stats
- Comprehensive unit tests
