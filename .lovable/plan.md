

## Replace "Interaction Engine" Section with Protocol Architecture

### What changes
Replace the 3-panel "Interaction Engine" section (lines 1802-1933 in `public/aero.html`) which currently shows generic design tool content (Scroll Animations, State Transitions, Component Logic) with GPU marketplace protocol architecture content.

### New content

**Section header**: "Protocol Architecture" with tag "ZK // COMMIT_REVEAL"

**Panel 01 — COMMIT-REVEAL**
- Title: "COMMIT-REVEAL" / 01//
- Description: "Orders are encrypted client-side using commit-reveal schemes. No participant — including the protocol — can see order details until the batch clears."
- Footer label: "SCHEME: PEDERSEN"
- Footer text: "Cryptographic commitments bind order parameters without revealing price, quantity, or direction to any party."
- Keep the existing canvas visualization (topology engine) — it works well as an abstract representation of cryptographic structures

**Panel 02 — BATCH MATCHING**
- Title: "BATCH MATCHING" / 02//
- Description: "Orders accumulate in 30-60 second batches. A uniform clearing price algorithm matches all compatible orders simultaneously, eliminating MEV extraction."
- Footer label: "MODE: UNIFORM_PRICE"
- Footer text: "Single clearing price per batch ensures fair execution — no frontrunning, no sandwich attacks, no information leakage."
- Keep existing canvas visualization

**Panel 03 — ON-CHAIN SETTLEMENT**
- Title: "ON-CHAIN SETTLEMENT" / 03//
- Description: "Matched orders settle atomically on Base L2. ZK proofs verify fair execution without revealing individual order details. USDC escrow ensures instant finality."
- Footer label: "OUTPUT: VERIFIED"
- Footer text: "Settlement proofs are posted on-chain for full auditability while preserving trader privacy."
- Keep existing canvas and bar chart visualizations

### Files changed

| Action | File |
|--------|------|
| Edit | `public/aero.html` (lines 1802-1933) — Replace text content only, preserve panel structure and canvas elements |

### Approach
Only replace the text strings inside the existing `quant-reveal-inner` spans and plain text nodes. The panel structure, canvas elements, GSAP animations, and visual effects all remain untouched.

