# Matching Engine Changelog

## v1.0.0 (2026-03-30)

### Added
- Uniform price batch auction algorithm
- 45-second interval with Redis distributed lock
- Per-GPU-type auctions (H100, A100, RTX4090, L40S, H200, A10G)
- Clearing price finder (volume-maximizing with tie-breaking)
- Order book builder (bid/ask separation and sorting)
- Order matcher (1:1 pairing at clearing price)
- Manual trigger endpoint (POST /api/matching/trigger, admin only)
- Redis pub/sub: batch:phase and batch:completed events
- BatchMetricsService for real-time analytics
- Comprehensive unit tests for all algorithms
