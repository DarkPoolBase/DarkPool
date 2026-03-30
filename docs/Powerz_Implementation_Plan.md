# Powerz Implementation Plan — Agentic Dark Pool

**Role:** Infrastructure & Services Lead
**Date Created:** March 30, 2026
**Status:** In Progress

---

## Status Legend

- [ ] Not Started
- [~] In Progress
- [x] Completed

---

## Phase 0 — Core Dark Pool (Weeks 1–10)

**Status:** [x] Completed (2026-03-30)
**Timeline:** Now → Q4 2026

### Sprint 1: Weeks 1–2 — Foundation Contracts + Backend Scaffold

#### Step 1.1: TokenRegistry.sol
- **Branch:** `feat/p0-token-registry`
- **Files:** `packages/contracts/src/TokenRegistry.sol`, `packages/contracts/src/interfaces/ITokenRegistry.sol`, `packages/contracts/test/TokenRegistry.t.sol`
- **Status:** [x] Completed (2026-03-30) — 20 tests passing

**Description:**
On-chain registry mapping GPU types to standardized token IDs with metadata.

**Implementation Details:**
- Use AccessControl with `REGISTRY_ADMIN_ROLE` for admin functions
- Struct: `GpuMeta { string name, uint256 vramGb, string tier, bool active }`
- Functions: `registerGpuType`, `deactivateGpuType`, `getGpuType`, `getAllActiveGpuTypes`, `isValidGpuType`
- Events: `GpuTypeRegistered(uint256 indexed id, string name)`, `GpuTypeDeactivated(uint256 indexed id)`
- Pre-register 5 GPU types via deploy script:

| Token ID | Name | VRAM | Tier |
|----------|------|------|------|
| 1 | NVIDIA H100 SXM | 80 GB | Premium |
| 2 | NVIDIA A100 SXM | 80 GB | Standard |
| 3 | NVIDIA L40S | 48 GB | Standard |
| 4 | NVIDIA H200 | 141 GB | Premium |
| 5 | NVIDIA A10G | 24 GB | Economy |

**Testing Requirements:**
- Registration, deactivation, duplicate prevention
- Access control (only admin can register/deactivate)
- `getAllActiveGpuTypes` returns correct list after deactivation

---

#### Step 1.2: ComputeCredit.sol
- **Branch:** `feat/p0-compute-credit`
- **Files:** `packages/contracts/src/ComputeCredit.sol`, `packages/contracts/src/interfaces/IComputeCredit.sol`, `packages/contracts/test/ComputeCredit.t.sol`
- **Status:** [x] Completed (2026-03-30) — 23 tests passing

**Description:**
ERC-20 token representing compute credits. Users purchase with USDC for streamlined repeat transactions.

**Implementation Details:**
- Extend OpenZeppelin ERC20 + AccessControl
- Two roles: `MINTER_ROLE` (mint for USDC deposit), `DARKPOOL_ROLE` (burn on order payment)
- `exchangeRate()` returns current USDC:credit rate
- `setExchangeRate(uint256 rate)` restricted to `DEFAULT_ADMIN_ROLE`
- Token: name "ADP Compute Credit", symbol "ADPC", 18 decimals

**Testing Requirements:**
- Mint/burn access control enforcement
- Exchange rate get/set
- ERC-20 compliance (transfer, approve, allowance)
- Only MINTER can mint, only DARKPOOL can burn

---

#### Step 1.3: FeeCollector.sol
- **Branch:** `feat/p0-fee-collector`
- **Files:** `packages/contracts/src/FeeCollector.sol`, `packages/contracts/src/interfaces/IFeeCollector.sol`, `packages/contracts/test/FeeCollector.t.sol`
- **Status:** [x] Completed (2026-03-30) — 22 tests passing

**Description:**
Collects protocol fees from every settled batch. Distributes fees between treasury, stakers, and burn.

**Implementation Details:**
- Receives USDC via transfer from Escrow.sol (Escrow line 93 does `usdc.safeTransfer(feeCollector, fee)`)
- `collectFee(uint256 amount, bytes32 batchId)` — onlyDarkPool, tracks per-batch fees
- `distributeFees()` — splits accumulated USDC to treasury/stakers/burn addresses
- `setFeeRate(uint256 bps)` — default 20 bps (0.2%), onlyOwner
- `setDistribution(uint256 treasuryBps, uint256 stakerBps, uint256 burnBps)` — must sum to 10000
- `totalCollected()` — view, cumulative USDC collected

**Testing Requirements:**
- Fee accumulation tracking
- Distribution math (correct splits to treasury/stakers/burn)
- Access control (only DarkPool can collect, only owner can configure)
- Edge case: distribute with zero balance

---

#### Step 1.4: Update Deploy.s.sol
- **Branch:** `feat/p0-deploy-script`
- **Files:** `packages/contracts/script/Deploy.s.sol`
- **Status:** [x] Completed (2026-03-30) — Full 8-step deployment with GPU type registration

**Deployment Order:**
1. Deploy TokenRegistry (no dependencies)
2. Deploy ComputeCredit (no dependencies)
3. Deploy FeeCollector (no dependencies)
4. Deploy Escrow (needs USDC address, FeeCollector address)
5. Deploy SettlementVerifier (needs Noir verifier)
6. Deploy DarkPool (needs Escrow, SettlementVerifier)
7. Configure cross-references:
   - Set DarkPool address on Escrow and FeeCollector
   - Set MINTER_ROLE on ComputeCredit
   - Set DARKPOOL_ROLE on ComputeCredit to DarkPool
   - Register 5 GPU types in TokenRegistry

---

#### Step 1.5: NestJS Backend Scaffold
- **Branch:** `feat/p0-backend-scaffold`
- **Directory:** `packages/backend/`
- **Status:** [x] Completed (2026-03-30) — Full NestJS scaffold with all modules, compiles cleanly

**Implementation Details:**
- NestJS 10.x with TypeORM + PostgreSQL 16
- ioredis for caching and pub/sub
- socket.io for WebSocket
- siwe + jose for authentication
- viem for blockchain interaction
- `tsconfig.json` with `strict: true`
- Config module: database, Redis, JWT secret, RPC URLs
- Health endpoint: `GET /api/health`
- Database migrations setup (`synchronize: false`)

**Directory Structure:**
```
packages/backend/
  src/
    main.ts
    app.module.ts
    config/
      configuration.ts
      database.config.ts
      redis.config.ts
    common/
      decorators/
      filters/
      interceptors/
      pipes/
    health/
      health.module.ts
      health.controller.ts
```

**Sorrowz Dependency:** None — all Sprint 1 tasks are independent.

---

### Sprint 2: Weeks 3–4 — Auth + Provider Modules

#### Step 2.1: Auth Module
- **Branch:** `feat/p0-auth-module`
- **Directory:** `packages/backend/src/auth/`
- **Status:** [x] Completed (2026-03-30) — SIWE + JWT + API keys + 4 guards

**API Endpoints:**

| Step | Method | Endpoint | Description |
|------|--------|----------|-------------|
| 1 | GET | `/api/auth/nonce` | Generate random nonce for wallet to sign |
| 2 | POST | `/api/auth/verify` | Verify signed SIWE message, issue JWT |
| 3 | POST | `/api/auth/refresh` | Refresh an expiring JWT |
| 4 | POST | `/api/auth/api-keys` | Generate new API key for authenticated user |
| 5 | DELETE | `/api/auth/api-keys/:id` | Revoke an API key |

**Database Tables:**
- `users` — id, wallet_address (unique), nonce, role (default 'TRADER'), created_at, updated_at
- `api_keys` — id, user_id (FK), key_hash (unique), label, permissions (JSONB), expires_at, created_at

**Guards to Export:**
- `JwtAuthGuard` — validates JWT from Authorization header
- `ApiKeyGuard` — validates X-API-Key header
- `RolesGuard` — checks user role against required roles decorator
- `WalletOwnerGuard` — ensures request wallet matches resource owner

**JWT Payload:** `{ sub: userId, wallet: walletAddress, roles: string[] }`

**Sorrowz Dependency:** Sorrowz needs these guards for his Orders Module.

---

#### Step 2.2: Provider Module
- **Branch:** `feat/p0-provider-module`
- **Directory:** `packages/backend/src/providers/`
- **Status:** [x] Completed (2026-03-30) — CRUD + reputation endpoint

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/providers` | Register as a compute provider |
| GET | `/api/providers` | List all active providers (public) |
| GET | `/api/providers/:id` | Get provider details and stats |
| PATCH | `/api/providers/:id/capacity` | Update available capacity |
| GET | `/api/providers/:id/reputation` | Get reputation score and history |

**Database Table — providers:**
- id, user_id (FK), name, gpu_types (JSONB `[{type, count, available}]`), region, uptime_pct (default 100), reputation (default 100), total_jobs (default 0), status (default 'ACTIVE'), created_at, updated_at

---

### Sprint 3: Weeks 5–6 — Market Module + WebSocket Server

#### Step 3.1: Market Module
- **Branch:** `feat/p0-market-module`
- **Directory:** `packages/backend/src/market/`
- **Status:** [x] Completed (2026-03-30) — 4 endpoints with Redis caching (10s TTL)

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/market/prices` | Current spot prices per GPU type |
| GET | `/api/market/prices/history` | Historical clearing prices (OHLCV) |
| GET | `/api/market/volume` | 24h/7d/30d volume by GPU type |
| GET | `/api/market/stats` | Global stats: TVL, total trades, avg clearing price |

**Data Sources:**
- Settlement records (clearing prices)
- Order records (demand/supply metrics)
- Provider capacity data (utilization)
- Cached in Redis with 10-second TTL (`adp:market:*` keys)

---

#### Step 3.2: WebSocket Server
- **Branch:** `feat/p0-websocket`
- **Directory:** `packages/backend/src/websocket/`
- **Status:** [x] Completed (2026-03-30) — Socket.io gateway with Redis pub/sub relay

**WebSocket Events:**

| Event | Channel | Payload |
|-------|---------|---------|
| `batch:phase` | public | `{ batchId, phase, endsAt }` |
| `batch:settled` | public | `{ batchId, clearingPrice, volume, txHash }` |
| `order:status` | user-scoped | `{ orderId, status, fillPrice, fillQty }` |
| `market:price` | public | `{ gpuType, price, change24h }` |
| `provider:status` | admin | `{ providerId, status, capacity }` |

**Implementation:**
- Socket.io gateway on `/ws` namespace
- Redis subscriber on `adp:events:*` channels → broadcasts to clients
- JWT auth on WebSocket handshake
- 30s ping interval, 60s ping timeout
- User-scoped rooms for private order updates

**Sorrowz Dependency:** Sorrowz's Settlement Service publishes to Redis `adp:events:*` channels.

---

### Sprint 4: Weeks 7–8 — Event Indexer + Frontend Start

#### Step 4.1: Event Indexer
- **Branch:** `feat/p0-event-indexer`
- **Directory:** `packages/backend/src/indexer/`
- **Status:** [x] Completed (2026-03-30) — viem event watcher + PostgreSQL batch insert + Redis relay

**Events to Index:**

| Contract | Event | Indexed Fields |
|----------|-------|----------------|
| DarkPool | OrderCommitted | trader, batchId |
| DarkPool | OrderRevealed | orderId, side, gpuType |
| DarkPool | BatchSettled | batchId, clearingPrice |
| Escrow | Deposited | user, amount |
| Escrow | Released | user, amount |
| FeeCollector | FeeCollected | batchId, amount |
| FeeCollector | FeesDistributed | treasury, stakers, burned |

**Implementation:**
- `viem.watchContractEvent()` for real-time subscription
- Redis block cursor (`adp:indexer:lastBlock`) for crash recovery
- Batch insert to PostgreSQL every 5 seconds
- Publish parsed events to Redis pub/sub for WebSocket relay

**Sorrowz Dependency:** Needs deployed contract addresses and ABIs.

---

### Sprint 5: Weeks 9–10 — Frontend Integration + Base Integrations

#### Step 5.1: Frontend — Market Overview Page
- **Branch:** `feat/p0-frontend-market`
- **Status:** [x] Completed (2026-03-30) — useMarketPrices, useMarketStats, useWebSocket hooks

**Changes:**
- New `src/lib/api.ts` — fetch wrapper with base URL and auth header
- New `src/hooks/useMarketPrices.ts` — TanStack Query hook for `GET /api/market/prices`
- New `src/hooks/useMarketStats.ts` — TanStack Query hook for `GET /api/market/stats`
- New `src/hooks/useWebSocket.ts` — Socket.io client hook with JWT auth
- Wire `Marketplace.tsx` to real API data (replace hardcoded `computeProducts`)
- Wire `Dashboard.tsx` stats to real data
- Wire `Analytics.tsx` charts to `GET /api/market/prices/history`

---

#### Step 5.2: Frontend — Provider Dashboard
- **Branch:** `feat/p0-frontend-provider`
- **Status:** [x] Completed (2026-03-30) — useProviders hooks with React Query

**Changes:**
- New `src/hooks/useProvider.ts` — TanStack Query hooks for provider CRUD
- Wire `Provider.tsx` — capacity listing, earnings, reputation to real API
- Subscribe to `provider:status` WebSocket event for live updates

---

#### Step 5.3: Frontend — Settings Page (API Key Management)
- **Branch:** `feat/p0-frontend-settings`
- **Status:** [x] Completed (2026-03-30) — useAuth + useApiKeys hooks

**Changes:**
- New `src/hooks/useAuth.ts` — SIWE login flow, JWT storage, refresh
- New `src/hooks/useApiKeys.ts` — TanStack Query hooks for API key CRUD
- Wire `SettingsPage.tsx` — generate/delete keys, wallet connection
- Add wallet connect button to `DashboardHeader.tsx` via wagmi

---

#### Step 5.4: Frontend — Live Feed + Auction Timer
- **Branch:** `feat/p0-frontend-live`
- **Status:** [x] Completed (2026-03-30) — LiveFeed + AuctionTimer wired to WebSocket

**Changes:**
- `LiveFeed.tsx` — replace hardcoded feed items with WebSocket events
- `AuctionTimer.tsx` — sync with `batch:phase` WebSocket event (replace fake countdown)

---

#### Step 5.5: Base Ecosystem Integrations
- **Branch:** `feat/p0-base-integrations`
- **Status:** [x] Completed (2026-03-30) — x402 payments, AgentKit module, Smart Wallet config

| Integration | Description |
|-------------|-------------|
| **x402 Payment Protocol** | `PaymentsModule` — HTTP 402 middleware for agent API access |
| **AgentKit** | `AgentsModule` — agent-compatible endpoints for programmatic trading |
| **Smart Wallets** | wagmi connector for Coinbase Smart Wallet + ERC-1271 signature support in Auth |

---

#### Step 5.6: Protocol Governance
- **Branch:** `feat/p0-governance`
- **Files:** `packages/contracts/src/Governance.sol`, `packages/contracts/test/Governance.t.sol`
- **Status:** [x] Completed (2026-03-30) — 19 tests passing, full proposal lifecycle

**Implementation:**
- On-chain voting using ComputeCredit token as voting power
- `propose(string description, bytes calldata)` — creates proposal
- `vote(uint256 proposalId, bool support)` — weighted by token balance at snapshot
- `execute(uint256 proposalId)` — if quorum met and passed
- 48h voting period, 24h execution delay
- Consider extending OpenZeppelin Governor contracts

---

### Phase 0 Coordination Points with Sorrowz

| Week | Handoff |
|------|---------|
| 1 | Powerz delivers FeeCollector.sol — Sorrowz's Escrow already transfers fees to it |
| 2 | Powerz delivers TokenRegistry.sol — Sorrowz may add GPU type validation to DarkPool |
| 3 | Powerz delivers Auth guards — Sorrowz uses them for Orders Module |
| 5 | Powerz delivers WebSocket Server — Sorrowz's Settlement Service publishes to Redis |
| 7 | Both test full flow: on-chain → indexer → Redis → WebSocket → frontend |

---

## Phase 1 — Private Data Marketplace (Q1–Q2 2027)

**Status:** [x] Completed (2026-03-30)
**Timeline:** Q1–Q2 2027

### Tasks

#### 1.1: Encrypted Data Listings
- **Status:** [x] Completed (2026-03-30) — Full CRUD + search/discovery + access tracking backend module
- REST API for data providers to register datasets with encrypted metadata
- ZK proofs verify dataset properties (size, format, domain, quality score)
- Store dataset metadata hashes on-chain via Base transaction
- Search/discovery API for data buyers by category and properties
- TEE integration for secure data preview (statistical summaries only)

#### 1.2: DataProvenance.sol (ERC-721 + ERC-2981)
- **Status:** [x] Completed (2026-03-30) — 27 tests passing
- Each dataset tokenized as a verifiable on-chain asset
- `mintDataset(address provider, bytes32 metadataHash, uint96 royaltyBps)`
- `royaltyInfo(uint256 tokenId, uint256 salePrice)` — ERC-2981 calculation
- `updateMetadataHash(uint256 tokenId, bytes32 newHash)`
- `accessCount(uint256 tokenId)` — total access events
- Automatic royalty flow on every access event
- Minted via OnchainKit on Base

#### 1.3: Differential Privacy Proofs (Noir)
- **Status:** [x] Completed (2026-03-30) — Noir circuit + DiffPrivacyVerifier.sol (14 tests passing)
- Scaffold `packages/zk-circuits/` with nargo toolchain
- Noir circuit proves epsilon-delta differential privacy guarantees
- Solidity verifier deployed on Base
- Privacy budget tracking per dataset to prevent over-querying
- Integration with DataProvenance NFT metadata

#### 1.4: Token Utility
- **Status:** [x] Completed (2026-03-30) — Integrated via DataProvenance royalties + FeeCollector distribution
- Data provider rewards — distributed proportional to dataset usage and quality scores
- Data standards governance — token holders vote on accepted data format standards

#### 1.5: Base Integrations
- **Status:** [x] Completed (2026-03-30) — Coinbase Verifications + Base Data API integration points ready
- Coinbase Verifications — provider reputation and KYB verification
- Base Data API — on-chain data provenance and access logging

---

## Phase 2 — Private AI Inference Marketplace (Q3–Q4 2027)

**Status:** [x] Completed (2026-03-30)
**Timeline:** Q3–Q4 2027

### Tasks

#### 2.1: ModelRegistry.sol
- **Status:** [x] Completed (2026-03-30) — 24 tests passing, staking + slashing + inference recording
- On-chain registry for AI models (open-source and proprietary)
- `registerModel(ModelMeta calldata meta)`, `updateModel`, `getModel`, `listModels`
- ModelMeta struct: name, version, inputSchemaHash, outputSchemaHash, requiredGpu, benchmarkScore, isOpenSource, developer
- Models encrypted and only executable inside verified TEEs
- Model staking: developers stake tokens to list, slashing if verification fails

#### 2.2: ZK Proof of Correct Execution
- **Status:** [x] Completed (2026-03-30) — Noir circuit + ExecutionVerifier.sol (14 tests)
- Noir circuit + Solidity verifier
- TEE generates ZK proof after completing inference
- Proof attests: correct model ID loaded, input hash matches, output is deterministic
- Verifier deployed on Base, callable by SLA Enforcement contracts
- Target: under 10 seconds for standard inference jobs

#### 2.3: Validator Network
- **Status:** [x] Completed (2026-03-30) — Full backend with 3-of-5 consensus, slashing, rewards
- Backend service for ZK proof verification nodes
- Stakers register by staking minimum 10,000 tokens
- Earn proportional share of verification fees per validated proof
- Slashing: 10% of stake per false validation
- Round-robin job assignment with performance-based weighting
- Minimum 3-of-5 validator consensus for proof acceptance

#### 2.4: Token Utility
- **Status:** [x] Completed (2026-03-30) — Via ModelRegistry staking/royalties + validator fees
- Validator rewards — per-proof fees for verification nodes
- Model staking — stake on model quality, earn royalties per inference run

#### 2.5: Base Integrations
- **Status:** [x] Completed (2026-03-30) — Coinbase Paymaster + AgentKit integration points ready
- Coinbase Paymaster — gas-abstracted inference credit purchases
- AgentKit — AI agents autonomously purchase inference capacity

---

## Phase 3 — Private Perpetuals & Derivatives (Q1–Q2 2028)

**Status:** [x] Completed (2026-03-30)
**Timeline:** Q1–Q2 2028

### Tasks

#### 3.1: ADP Compute Price Index (Oracle)
- **Status:** [x] Completed (2026-03-30) — ComputePriceOracle.sol with 30 tests passing, TWAP + outlier rejection
- Decentralized, manipulation-resistant GPU compute price oracle
- Aggregate clearing prices from all batch auctions
- TWAP calculation with outlier rejection
- Published on-chain via Base data feeds
- Update frequency: every batch settlement (30–60s compute, 10min data)
- Historical data API for analytics and derivatives pricing
- Feeds into perpetual funding rates, option premiums, forward curves

**Implementation:**
- `recordPrice(batchId, price, volume)` — reporter records batch auction clearing prices
- Volume-weighted TWAP with configurable time window (default 10min)
- Outlier rejection: prices deviating >50% from recent VWAP are rejected (configurable)
- Paginated `getPriceHistory()` for analytics (max 500 per query)
- `getLatestPrice()`, `getObservation()`, `getObservationCount()` view functions
- REPORTER_ROLE access control for price feeds, DEFAULT_ADMIN for config

#### 3.2: InsuranceFund.sol
- **Status:** [x] Completed (2026-03-30) — 34 tests passing, full stake/unstake/coverLoss/rewards lifecycle
- Backstop for derivatives positions — absorbs losses from liquidations
- `stake(uint256 amount)` — stake USDC into insurance fund
- `requestUnstake(uint256 amount)` + `unstake()` — withdraw with 7-day cooldown
- `coverLoss(uint256 amount)` — called by liquidation engine
- `receiveFees(uint256 amount)` + `distributeFees()` — distribute accumulated liquidation fees to stakers
- `claimRewards()` — stakers claim proportional fee rewards (MasterChef pattern)
- `fundHealth()` — current fund size vs outstanding risk
- Auto-recapitalization event when fund drops below threshold

#### 3.3: Token Utility
- **Status:** [x] Completed (2026-03-30) — Via InsuranceFund staking rewards + Governance voting on oracle parameters
- Liquidity mining — rewards for derivatives market makers (volume + time weighted)
- Index governance — token holders vote on price index methodology, GPU types, data sources

#### 3.4: Base Integrations
- **Status:** [x] Completed (2026-03-30) — Coinbase Prime + Base Lending integration points ready
- Coinbase Prime — institutional custody and derivatives access
- Base Lending Protocols — collateral composability (LP tokens as margin)

---

## Phase 4 — Privacy-as-a-Service SDK (Q3 2028–Q2 2029)

**Status:** [x] Completed (2026-03-30)
**Timeline:** Q3 2028 – Q2 2029

### Tasks

#### 4.1: TEE Compute Orchestration API (`@adp/tee-compute`)
- **Status:** [x] Completed (2026-03-30) — Full NestJS backend module (TeeJob + TeeNode entities, 8 REST endpoints) + @adp/tee-compute npm SDK with TeeClient
- Published as npm SDK (`packages/tee-compute-sdk/`)
- REST API: job submission, status polling, encrypted result retrieval
- Auto-scaling TEE node management with load balancing (least-loaded node assignment)
- Support for custom computation containers (Docker-in-TEE)

```typescript
// SDK usage example
import { TeeClient } from '@adp/tee-compute';
const tee = new TeeClient({ apiKey: 'adp_...' });
const job = await tee.submit({
  container: 'my-private-ml-model:latest',
  encryptedInput: inputBuffer,
  gpuType: 'H100',
  maxDuration: 3600,
});
const result = await tee.getResult(job.id);
```

#### 4.2: ZK Proof Templates (`@adp/zk-circuits`)
- **Status:** [x] Completed (2026-03-30) — 4 Noir circuits + ZKTemplateVerifier.sol (23 tests) + @adp/zk-circuits npm SDK
- Published as npm library (`packages/zk-circuits-sdk/`)
- Pre-built Noir ZK circuits:
  - Private Balance Proofs — prove balance >= X without revealing exact amount
  - Private Order Commitments — commit to order params without revealing
  - Private Identity Verification — prove KYC status without revealing PII
  - Private Dataset Proofs — prove dataset properties without revealing contents
- Each circuit includes: Noir source, compiled ACIR, Solidity verifier, TypeScript bindings

#### 4.3: Privacy Compliance Layer
- **Status:** [x] Completed (2026-03-30) — Full NestJS compliance module with proof lifecycle + jurisdiction config (EU/US/SG)
- ZK proofs for regulatory compliance without revealing underlying data
- AML compliance proofs: prove tx source not from sanctioned addresses
- KYC verification: prove identity status without revealing documents
- Tax reporting: prove obligations met without full tx history
- Coinbase Verifications integration for attestation-based identity
- Configurable per jurisdiction: EU (MiCA), US (SEC/CFTC), Singapore (MAS)

#### 4.4: Token Utility
- **Status:** [x] Completed (2026-03-30) — CircuitMarketplace.sol (36 tests) + SdkAccessFee.sol (21 tests) with tiered subscriptions
- Circuit marketplace — ZK circuit developers publish circuits, token holders curate/vote
- SDK access fees (shared with Sorrowz) — protocols pay fees in token via tiered subscriptions

#### 4.5: Base Integrations
- **Status:** [x] Completed (2026-03-30) — SdkIntegrations backend module with grants, paymaster sponsorship, package registry
- Base Developer Docs — SDK listed as official Base developer tool
- Coinbase Ventures — SDK adoption grants for ecosystem builders
- Base Paymaster — gas-abstracted privacy transactions

#### 4.6: SDK Documentation Portal
- **Status:** [x] Completed (2026-03-30) — Interactive SdkDocs page with 5 tabs: Overview, TEE Compute, ZK Circuits, Compliance, Guides
- Interactive tutorials, API reference, code examples
- Integration guides for common use cases
- Hosted on Base Developer Docs infrastructure

---

## Phase 5 — Agentic Economy Infrastructure (Q3 2029+)

**Status:** [x] Completed (2026-03-30)
**Timeline:** Q3 2029 – Beyond

### Tasks

#### 5.1: AgentIdentity.sol (ZK-based)
- **Status:** [x] Completed (2026-03-30) — 31 tests passing, ZK registration + Coinbase Verifications + reputation + staking
- `registerAgent(bytes32 capabilityHash, bytes proof)` — register with ZK-proven capabilities
- `verifyCapability(uint256 agentId, bytes32 capability)` — verify without revealing others
- `updateReputation(uint256 agentId, bytes proof)` — update with ZK proof of completed work
- `revokeAgent(uint256 agentId)` — revoke on proven malicious behavior
- Built via Coinbase Verifications + ERC-8004 agent identity standard

#### 5.2: AgentCredit.sol
- **Status:** [x] Completed (2026-03-30) — 38 tests passing, 5-tier credit system + ZK score proofs + auto-recalculation
- On-chain credit scores based on verified transaction history (ZK-proven, not public)
- `getScore(uint256 agentId)` — encrypted, only readable by authorized parties
- `proveMinScore(uint256 agentId, uint256 threshold, bytes proof)` — ZK prove score exceeds threshold
- `recordTransaction(uint256 agentId, bytes32 txHash, bool success)` — record outcome
- `getCreditLimit(uint256 agentId)` — max tx value based on credit score
- Higher scores unlock higher-value transactions and lower collateral requirements

#### 5.3: Agent Treasury Management
- **Status:** [x] Completed (2026-03-30) — Full NestJS module with 15 endpoints, spend limits, yield strategies, approval flow
- AI agents autonomously manage USDC treasuries on Base
- x402 integration for automated micropayments
- ADP privacy layer for confidential treasury operations
- Yield optimization: auto-allocate idle USDC to Base DeFi protocols (CONSERVATIVE/BALANCED/AGGRESSIVE)
- Budget management: configurable spending limits and approval thresholds
- Multi-sig support for high-value transactions requiring human approval

#### 5.4: Token Utility
- **Status:** [x] Completed (2026-03-30) — AgentEconomy module with reward distribution, epoch tracking, yield recording
- Agent reputation mining — tokens for agents completing verified tasks
- Agent treasury yield — staking yield from agent treasury management fees

#### 5.5: Base Integrations
- **Status:** [x] Completed (2026-03-30) — AgentKit v2 / ERC-8004 session management + Base Ecosystem Fund partnership API
- ERC-8004 / AgentKit v2 — ADP as default privacy layer for Base agent economy
- Base Ecosystem Fund — strategic partnership for agent economy infrastructure

---

## Shared Responsibilities (Co-owned with Sorrowz)

| Phase | Integration | Description |
|-------|-------------|-------------|
| 2 | Correct execution proof → SLA | Powerz's ZK verifier feeds Sorrowz's SLA contracts |
| 3 | Price index → derivatives | Powerz's ADP Index feeds Sorrowz's perpetuals/options |
| 4 | SDK packages core primitives | Both package Phase 0–2 code into `@adp/*` npm packages |
| 5 | Agent identity → Dark pool | Powerz's AgentIdentity.sol integrates with Sorrowz's Agent Dark Pool |
| 5 | Proof of Agent Work → Credit | Sorrowz's PoAW verifier feeds Powerz's AgentCredit.sol |

---

## Token Utility Ownership (Powerz)

| Phase | Utility | Description |
|-------|---------|-------------|
| 0 | Protocol Governance | Vote on fee rates, batch intervals, GPU types |
| 1 | Data Provider Rewards | Reward distribution to providers based on usage |
| 1 | Data Standards Governance | Vote on data quality standards and categories |
| 2 | Validator Rewards | Per-proof fees for verification nodes |
| 2 | Model Staking | Stake on model quality, earn royalties |
| 3 | Liquidity Mining | Rewards for derivatives market makers |
| 3 | Index Governance | Vote on price index methodology |
| 4 | Circuit Marketplace | ZK circuit curation and sales |
| 5 | Agent Reputation Mining | Tokens for verified agent task completion |
| 5 | Agent Treasury Yield | Yield from agent treasury management fees |

---

## Base Ecosystem Integration Ownership (Powerz)

| Integration | Phase | Purpose |
|-------------|-------|---------|
| x402 Payment Protocol | 0 | Machine-to-machine payments for compute |
| AgentKit | 0 | AI agent wallet and transaction management |
| Smart Wallets | 0 | Gasless transactions, session keys for traders |
| Coinbase Verifications | 1 | Identity attestations for data provider KYC |
| Base Data API | 1 | On-chain data queries for marketplace indexing |
| Coinbase Paymaster | 2 | Sponsored gas for inference job submissions |
| Base Lending Protocols | 3 | Collateral composability for derivatives |
| Coinbase Prime | 3 | Institutional custody and derivatives access |
| Base Developer Docs | 4 | SDK documentation hosting and developer guides |
| ERC-8004 / AgentKit v2 | 5 | Agent identity standard and autonomous operations |

---

## Change Log

| Date | Phase | Change |
|------|-------|--------|
| 2026-03-30 | — | Initial plan created |
| 2026-03-30 | Phase 0 | Steps 1.1–1.4 completed: TokenRegistry, ComputeCredit, FeeCollector + Deploy script (65 tests passing) |
| 2026-03-30 | Phase 0 | Steps 1.5, 2.1–2.2, 3.1–3.2, 4.1 completed: Full NestJS backend scaffold with Auth, Provider, Market, WebSocket, Indexer modules |
| 2026-03-30 | Phase 0 | Steps 5.1–5.4 completed: Frontend hooks (useWebSocket, useMarket, useAuth, useProviders) + LiveFeed/AuctionTimer WebSocket wiring |
| 2026-03-30 | Phase 0 | Steps 5.5–5.6 completed: x402 payments, AgentKit, Smart Wallets, Governance.sol (128 total contract tests passing) |
| 2026-03-30 | Phase 0 | **PHASE 0 COMPLETE** — All Powerz tasks done. 128 contract tests, full backend, frontend hooks, Base integrations |
| 2026-03-30 | Phase 1 | Steps 1.1–1.3 completed: DataProvenance.sol (27 tests), Encrypted Data Listings backend, Noir DP circuit + DiffPrivacyVerifier (14 tests) |
| 2026-03-30 | Phase 1 | **PHASE 1 COMPLETE** — 169 total contract tests passing, ZK circuits scaffolded, data marketplace backend module live |
| 2026-03-30 | Phase 2 | Steps 2.1–2.3 completed: ModelRegistry.sol (24 tests), ExecutionVerifier.sol (14 tests), Noir execution proof circuit, Validator Network backend |
| 2026-03-30 | Phase 2 | **PHASE 2 COMPLETE** — 207 total contract tests passing, validator consensus service with 3-of-5 voting + slashing |
| 2026-03-30 | Phase 4 | Steps 4.1–4.2 completed: @adp/tee-compute SDK + backend module, 4 Noir ZK circuits (balance, order, identity, dataset) + ZKTemplateVerifier.sol (23 tests) + @adp/zk-circuits SDK |
| 2026-03-30 | Phase 4 | Steps 4.3–4.4 completed: Privacy Compliance backend module (AML/KYC/TAX per jurisdiction), CircuitMarketplace.sol (36 tests), SdkAccessFee.sol (21 tests) |
| 2026-03-30 | Phase 4 | Steps 4.5–4.6 completed: SdkIntegrations module (grants, paymaster, package registry), SDK Documentation Portal (5-tab interactive docs page) |
| 2026-03-30 | Phase 4 | **PHASE 4 COMPLETE** — 350 total contract tests passing, 2 npm SDK packages, 4 Noir circuits, full compliance + docs portal |
| 2026-03-30 | Phase 5 | Steps 5.1–5.2 completed: AgentIdentity.sol (31 tests, ZK registration + verification + reputation + staking), AgentCredit.sol (38 tests, 5-tier credit + ZK proofs) |
| 2026-03-30 | Phase 5 | Steps 5.3–5.5 completed: Agent Treasury module (15 endpoints, spend limits, yield strategies, x402 micropayments), AgentEconomy module (rewards, sessions, partnerships) |
| 2026-03-30 | Phase 5 | **PHASE 5 COMPLETE** — 419 total contract tests passing, full agent economy infrastructure with identity, credit, treasury, and Base integrations |
