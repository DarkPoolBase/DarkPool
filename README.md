<div align="center">

# AGENTIC DARK POOL

**Privacy-Preserving GPU Compute Marketplace on Base**

[![Frontend](https://img.shields.io/badge/Frontend-Live-6C3CE9?style=flat-square)](https://www.darkpoolbase.org)
[![API](https://img.shields.io/badge/API-Live-10B981?style=flat-square)](https://darkpoolsolana-ljque.ondigitalocean.app/api/health)
[![Contracts](https://img.shields.io/badge/Tests-44%20Passing-10B981?style=flat-square)](#smart-contracts)
[![Base](https://img.shields.io/badge/Chain-Base-0052FF?style=flat-square)](https://base.org)

---

*A dark pool for AI compute. Encrypted order books, batch auctions, ZK proofs, USDC settlement.*

</div>

---

## Production URLs

| Service | URL | Platform |
|---------|-----|----------|
| **Frontend** | [darkpoolbase.org](https://www.darkpoolbase.org) | Vercel |
| **Backend API** | [darkpoolsolana-ljque.ondigitalocean.app/api](https://darkpoolsolana-ljque.ondigitalocean.app/api/health) | DigitalOcean |
| **Database** | Supabase PostgreSQL | Supabase |
| **Frontend Repo** | [onderwish1/darkpoolweb](https://github.com/onderwish1/darkpoolweb) | GitHub |
| **Backend Repo** | [sorrowzzz/darkpool-api](https://github.com/sorrowzzz/darkpool-api) | GitHub |

---

## Architecture

```
                         ┌─────────────────────────────┐
                         │     darkpoolbase.org         │
                         │   Vite + React + Tailwind    │
                         │        (Vercel)              │
                         └──────────┬──────────────────┘
                                    │ HTTPS
                         ┌──────────▼──────────────────┐
                         │   DigitalOcean App Platform  │
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
             │  Supabase   │ │   Redis    │ │    Base     │
             │ PostgreSQL  │ │  (optional)│ │ Blockchain  │
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
│           ├── orders/           # SORROWZ — Order CRUD, validation, Redis events
│           ├── matching/         # SORROWZ — Batch auction engine (45s interval)
│           ├── settlement/       # SORROWZ — On-chain settlement, order fill
│           ├── auth/             # POWERZ  — SIWE + JWT + API keys
│           ├── providers/        # POWERZ  — GPU provider registry
│           ├── market/           # POWERZ  — Price feeds, OHLCV, stats
│           ├── websocket/        # POWERZ  — Socket.io + Redis pub/sub
│           ├── indexer/          # POWERZ  — On-chain event listener
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
- PostgreSQL 16 (or Supabase account)
- Redis 7 (optional — app runs without it)

### 1. Clone & Install

```bash
git clone https://github.com/onderwish1/darkpoolweb.git
cd darkpoolweb
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

## Ownership Map

| Domain | Owner | Scope |
|--------|-------|-------|
| Smart Contracts (DarkPool, Escrow, Verifier) | **Sorrowz** | Core trading |
| Orders Module, Matching Engine, Settlement | **Sorrowz** | Backend trading core |
| Frontend wallet, order flow, dashboard wiring | **Sorrowz** | UI integration |
| Auth, Providers, Market, WebSocket, Indexer | **Powerz** | Infrastructure |
| TokenRegistry, ComputeCredit, FeeCollector | **Powerz** | Token contracts |
| Data Marketplace, Validators, TEE, Compliance | **Powerz** | Phase 1-4 modules |
| Agent Treasury, Agent Economy | **Powerz** | Phase 5 modules |

---

## Environment Variables

### Backend (.env)

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:pass@host:5432/darkpool
REDIS_HOST=localhost          # Optional — app runs without Redis
REDIS_PORT=6379
JWT_SECRET=your-secret-min-32-chars
JWT_EXPIRATION=1h
RPC_URL=https://sepolia.base.org
CHAIN_ID=84532
```

### Frontend (.env.development)

```env
VITE_API_BASE_URL=http://localhost:3001
```

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

### Frontend → Vercel

```bash
vercel --prod --yes
```

### Backend → DigitalOcean App Platform

Repo: `sorrowzzz/darkpool-api` → auto-deploys on push to `main`

- Build: `npm install && npm run build`
- Run: `node dist/main.js`
- Port: 8080

### Contracts → Base Sepolia

```bash
cd packages/contracts
source .env
forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC --broadcast
```

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
