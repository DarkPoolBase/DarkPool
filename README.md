<div align="center">

# AGENTIC DARK POOL

**Privacy-Preserving GPU Compute Marketplace on Base**

[![Contracts](https://img.shields.io/badge/Tests-44%20Passing-10B981?style=flat-square)](#smart-contracts)
[![Base](https://img.shields.io/badge/Chain-Base-0052FF?style=flat-square)](https://base.org)

---

*A dark pool for AI compute. Encrypted order books, batch auctions, ZK proofs, USDC settlement.*

</div>

---

## Architecture

```
                         ┌─────────────────────────────┐
                         │       Frontend App           │
                         │   Vite + React + Tailwind    │
                         └──────────┬──────────────────┘
                                    │ HTTPS
                         ┌──────────▼──────────────────┐
                         │      NestJS Backend API      │
                         │                              │
                         │  ┌─────────┐ ┌────────────┐ │
                         │  │ Orders  │ │  Matching   │ │
                         │  │ Module  │ │  Engine     │ │
                         │  └────┬────┘ └─────┬──────┘ │
                         │       │             │        │
                         │  ┌────▼─────────────▼─────┐ │
                         │  │   Settlement Service    │ │
                         │  └────────────┬───────────┘ │
                         └───────────────┼─────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
             ┌──────▼─────┐ ┌──────▼─────┐ ┌──────▼──────┐
             │ PostgreSQL  │ │   Redis    │ │    Base     │
             │  Database   │ │  (optional)│ │ Blockchain  │
             └─────────────┘ └────────────┘ └─────────────┘
```

---

## Monorepo Structure

```
darkpool/
├── src/                          # Frontend (Vite + React + TypeScript)
│   ├── pages/                    # Route pages (Dashboard, Orders, Marketplace...)
│   ├── components/               # UI components (50+ shadcn/Radix)
│   ├── contexts/WalletContext.tsx # Wallet state (MetaMask, Phantom, Coinbase)
│   ├── hooks/                    # React Query hooks (useOrders, useAuth...)
│   ├── lib/api.ts                # API client with JWT auth
│   └── config/contracts.ts       # Contract addresses
│
├── packages/
│   ├── contracts/                # Solidity smart contracts (Foundry)
│   │   ├── src/
│   │   │   ├── DarkPool.sol      # Main entry — order submission, batch settlement
│   │   │   ├── Escrow.sol        # USDC escrow — deposit, lock, release, refund
│   │   │   └── SettlementVerifier.sol  # V1: relayer signature, V2: ZK proofs
│   │   ├── test/                 # 44 passing tests (unit, fuzz, gas benchmarks)
│   │   └── script/Deploy.s.sol   # Base Sepolia deployment
│   │
│   └── backend/                  # NestJS API server
│       └── src/
│           ├── orders/           # Order CRUD, validation, Redis events
│           ├── matching/         # Batch auction engine (45s interval)
│           ├── settlement/       # On-chain settlement, order fill
│           ├── auth/             # SIWE + JWT + API keys
│           ├── providers/        # GPU provider registry
│           ├── market/           # Price feeds, OHLCV, stats
│           ├── websocket/        # Socket.io + Redis pub/sub
│           ├── indexer/          # On-chain event listener
│           ├── agents/           # Agent trading (wired to OrdersService)
│           ├── data-marketplace/ # Phase 1 — Encrypted data listings
│           ├── validators/       # Phase 2 — ZK proof validation network
│           ├── tee-compute/      # Phase 4 — TEE compute orchestration
│           ├── compliance/       # Phase 4 — Privacy compliance proofs
│           ├── agent-treasury/   # Phase 5 — Agent USDC treasury
│           └── agent-economy/    # Phase 5 — Reputation mining, sessions
│
├── public/aero.html              # Landing page (static, iframe)
├── docs/                         # Developer work split PDF, expansion roadmap
├── vercel.json                   # Vercel config (SPA rewrites, CORS)
├── docker-compose.yml            # Local PostgreSQL + Redis
└── Makefile                      # Common dev commands
```

---

## Developer Setup

### Prerequisites

- Node.js >= 18
- Foundry (`curl -L https://foundry.paradigm.xyz | bash`)
- PostgreSQL 16
- Redis 7 (optional — app runs without it)

### 1. Clone & Install

```bash
git clone https://github.com/DarkPoolBase/DarkPool.git
cd DarkPool
npm install
```

### 2. Smart Contracts

```bash
cd packages/contracts
forge build
forge test -vv          # 44 tests, all passing
```

### 3. Backend

```bash
cd packages/backend
npm install
cp .env.example .env    # Fill in DATABASE_URL, JWT_SECRET

# Start local infra (optional)
docker-compose up -d    # PostgreSQL + Redis

npm run start:dev       # http://localhost:3001/api/health
```

### 4. Frontend

```bash
# From repo root
npm run dev             # http://localhost:5173
```

---

## API Endpoints

### Public (no auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/orders/metrics` | Order volume, fill rates, GPU breakdown |
| GET | `/api/settlements` | Recent batch settlements |
| GET | `/api/market/prices` | GPU spot prices |
| GET | `/api/market/stats` | Global market statistics |
| GET | `/api/providers` | GPU provider listings |

### Authenticated (JWT via SIWE)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/nonce?address=0x...` | Get SIWE nonce |
| POST | `/api/auth/verify` | Verify signature, get JWT |
| POST | `/api/orders` | Submit encrypted order |
| GET | `/api/orders` | List user's orders (filtered, paginated) |
| GET | `/api/orders/stats` | Order count by status |
| DELETE | `/api/orders/:id` | Cancel active order |
| POST | `/api/matching/trigger` | Manual batch auction (admin) |

### Agent API (API key via X-API-Key header)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/agents/orders` | Submit order programmatically |
| GET | `/api/agents/orders` | List agent's orders |
| DELETE | `/api/agents/orders/:id` | Cancel agent order |

---

## Module Map

| Domain | Scope |
|--------|-------|
| Smart Contracts (DarkPool, Escrow, Verifier) | Core trading |
| Orders Module, Matching Engine, Settlement | Backend trading core |
| Frontend wallet, order flow, dashboard wiring | UI integration |
| Auth, Providers, Market, WebSocket, Indexer | Infrastructure |
| TokenRegistry, ComputeCredit, FeeCollector | Token contracts |
| Data Marketplace, Validators, TEE, Compliance | Phase 1-4 modules |
| Agent Treasury, Agent Economy | Phase 5 modules |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the required values. See the example files for the full list of variables needed for backend and frontend.

---

## Testing

### Smart Contracts (44 tests)

```bash
cd packages/contracts && forge test -vv
```

| Suite | Tests | Coverage |
|-------|-------|----------|
| DarkPool (core) | 19 | Submit, cancel, settle, admin, pause |
| Escrow | 9 | Deposit, withdraw, lock, release, fuzz |
| SettlementVerifier | 7 | Signature verify, relayer update, fuzz |
| Settlement flows | 3 | Balance updates, fees, idempotency |
| Access control | 4 | Role checks, admin gates |
| Gas benchmarks | 2 | submitOrder < 200k, cancelOrder < 100k |

### Backend

```bash
cd packages/backend && npm test
```

### End-to-End (manual)

```bash
# 1. Create orders
curl -X POST localhost:3001/api/orders -H "Authorization: Bearer $TOKEN" \
  -d '{"side":"BUY","gpuType":"H100","quantity":4,"pricePerHour":0.25,"duration":24,"commitmentHash":"0xab..."}'

# 2. Trigger matching
curl -X POST localhost:3001/api/matching/trigger -H "Authorization: Bearer $ADMIN_TOKEN"

# 3. Check settlements
curl localhost:3001/api/settlements
```

---

## Deployment

See internal documentation for deployment instructions.

---

## Roadmap

| Phase | Name | Status |
|-------|------|--------|
| **0** | Core Dark Pool (GPU marketplace) | **In Progress** |
| 1 | Private Data Marketplace | Contracts + module scaffolded |
| 2 | Private AI Inference Marketplace | Contracts + module scaffolded |
| 3 | Compute Perpetuals & Derivatives | Contracts scaffolded |
| 4 | Privacy-as-a-Service SDK | Module scaffolded |
| 5 | Agentic Economy Infrastructure | Module scaffolded |

---

<div align="center">

**Agentic Dark Pool** — *Private compute markets for the AI economy*

Built on [Base](https://base.org) | Settled in [USDC](https://www.circle.com/usdc) | Verified by [ZK Proofs](https://aztec.network/noir)

</div>
