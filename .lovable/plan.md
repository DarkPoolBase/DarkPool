

## Fix "How It Works" Section: Relevant Panels + Scroll Navigation

### Problem 1: Irrelevant right-side panels
The 4 nav items on the left (Encrypted Orders, Batch Auctions, Instant Settlement, Agent-Native API) scroll through right-side content panels that still show **design tool mockups** (Figma-like layer panels, CMS editors, typography/color panels, mobile phone frames). These need to be replaced with dashboard-like, GPU marketplace-relevant visualizations.

### Problem 2: Scroll navigation broken
The IntersectionObserver script at line 227 queries for a container element `[data-element-id="aura-emn1kp650mbex8x7"]` which **does not exist** in the HTML, so the observer never initializes and clicking the nav items does nothing. Also, there are only 3 `data-scroll-section` elements but 4 nav items.

---

### Plan

#### Step 1: Fix the scroll observer script (lines 226-289)
- Remove the `container` query — instead, scope nav items and sections directly from the `#diagnostics-section` parent
- Ensure all 4 `data-scroll-section` elements are found and mapped to the 4 nav items

#### Step 2: Replace Panel 1 — "Encrypted Orders" (lines 296-602)
Remove the Figma-like design tool mockup (layers tree, canvas with rulers, right sidebar with Layout/Typography/Fill panels). Replace with a **premium encrypted order submission mockup** showing:
- A glassmorphic card with a "Submit Encrypted Order" flow
- Buy/Sell toggle with green/red indicator
- GPU type selector showing "H100 NVIDIA 80GB"
- Price field, quantity slider, estimated total
- A lock icon with "Encrypting..." animation text
- Commit hash preview (e.g., `0x7a3b...f82c`)
- JetBrains Mono micro-labels for section headers
- Animated purple glow on the submit button

#### Step 3: Replace Panel 2 — "Batch Auctions" (lines 603-1158)
Remove the CMS editor mockup and the "Selected Works" grid (Product Design, Design Systems, Mobile Apps, Brand Strategy). Replace with a **batch auction matching engine visualization**:
- A depth chart mockup showing green buy bids and red sell asks
- Animated clearing price line at `$0.21/GPU-hr`
- Stats row: "23 orders matched", "340 GPU-hrs", "Batch #4521"
- A countdown timer circle showing "Next batch in 00:32"
- Order queue list showing anonymized orders being matched
- Corner accents and gradient borders matching the landing page style

#### Step 4: Replace Panel 3 — "Instant Settlement" (lines 1161-1226)
The "How It Works" table is fine content but it's mapped as the 3rd scroll section. Replace this with a **settlement flow visualization**:
- An animated transaction pipeline: Order Matched → ZK Proof Generated → On-Chain Settlement → GPU Access Granted
- Each step shown as a glassmorphic card in a horizontal/vertical flow with connecting lines
- Real stats: "$0.01 gas", "2 sec finality", "Base L2"
- A mock transaction receipt showing hash, block number, USDC amount
- Terminal-style log output: `Generating ZK commitment proofs... verified ✓`

#### Step 5: Add Panel 4 — "Agent-Native API" (new section)
Add a new `data-scroll-section` panel after the settlement panel:
- A dark code editor mockup with syntax-highlighted code showing the SDK:
  ```js
  import { DarkPoolClient } from '@agentic-darkpool/sdk';
  const order = await client.submitOrder({ side: 'buy', gpuType: 'H100' });
  ```
- Supported framework pills: "LangChain", "AutoGPT", "CrewAI", "x402"
- API response preview in a terminal: `{ "orderId": "#4521", "status": "encrypted" }`
- Stats: "< 100ms latency", "99.9% uptime", "REST + WebSocket"

#### Step 6: Keep the "How It Works" table
Move the existing step-by-step table (Connect Wallet → Submit Order → Batch Auction → Settlement) to appear **after** all 4 scroll-section panels, as standalone content below the sticky sidebar section.

---

### Files Changed

| Action | File |
|--------|------|
| Rewrite | `public/aero.html` (lines ~226-1226): Replace 3 design tool panels with 4 GPU marketplace panels, fix observer script, add 4th scroll section |

### Visual Style
All new panels will use the same glassmorphic aesthetic already in the landing page: `bg-[#0E0F11]`, `border-white/[0.06]`, `backdrop-blur-md`, `shadow-2xl`, purple glow blobs, JetBrains Mono labels, corner accents, and hover transitions. CSS-only animations for the pipeline flow and counting numbers (no additional JS libraries needed — GSAP is already loaded).

