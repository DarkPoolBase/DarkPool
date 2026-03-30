# Orders Module Changelog

## v1.0.0 (2026-03-30)

### Added
- Order entity with TypeORM (UUID PK, indexed columns)
- CRUD operations: create, findAll, findById, cancel
- Input validation: side, gpuType, quantity, price, duration, commitmentHash
- Escrow amount auto-calculation (quantity × price × duration)
- Redis event publishing for WebSocket relay (adp:events:order)
- OrderExpiryService: hourly cron to expire 7-day stale orders
- OrderMetricsService: dashboard analytics (volume, avg price, GPU breakdown)
- ParseOrderIdPipe: UUID format validation
- OrderOwnerGuard: resource-level authorization
- @CurrentOrder() decorator: extract order from request
- Custom validators: IsValidGpuType, IsValidOrderSide
- DTOs: CreateOrderDto, OrderFilterDto, OrderResponseDto, PaginatedResponseDto
- Comprehensive unit test suite (OrdersService, Controller, DTOs, Utils)
- Migration SQL with CHECK constraints and composite indexes

### Exposed for Matching Engine (Phase 0, #2)
- getActiveOrdersByGpuType(gpuType) — batch auction input
- fillOrders(orderIds, batchId, clearingPrice, txHash) — settlement output
