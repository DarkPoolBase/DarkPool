

## Replace Compute Pricing with FAQ Section

### What changes
Replace the entire pricing section (lines 2679-2827 in `public/aero.html`) — the 3-column pricing cards with monthly/annual toggle — with a premium glassmorphic FAQ accordion section.

### New section: Frequently Asked Questions

**Header area** (same pattern as other sections):
- Tag: `FAQ // PROTOCOL`
- Title: "Frequently Asked Questions"
- Subtitle: "Everything you need to know about the agentic dark pool protocol."

**FAQ items** (glassmorphic accordion — each item is a `glass-card` style panel):
Each FAQ is a clickable row with a question, plus/minus toggle icon, and expandable answer. Uses the existing design system: `bg-gradient-to-br from-white/[0.03] to-transparent`, `border border-white/5`, `backdrop-blur-md`, `rounded-2xl`, JetBrains Mono labels, violet accents.

**Questions sourced from the PDF research:**

1. **What is an agentic dark pool?** — A private exchange where AI agents trade GPU compute resources without exposing order details. Uses commit-reveal encryption and batch auctions to prevent MEV and ensure fair pricing.

2. **How does the batch auction work?** — Orders accumulate in 30-60 second windows. A uniform clearing price algorithm matches all compatible orders simultaneously — every participant gets the same price, eliminating frontrunning.

3. **What is commit-reveal and why does it matter?** — Orders are encrypted client-side using Pedersen commitments before submission. No one — including the protocol — can see price, quantity, or direction until the batch clears.

4. **How does settlement work?** — Matched orders settle atomically on Base L2 using USDC. ZK proofs verify fair execution without revealing individual order details. Typical settlement: under 2 seconds.

5. **What is the x402 payment protocol?** — An HTTP-native payment standard that lets AI agents pay per-request using USDC on Base. Agents include payment in HTTP headers — no wallets, no bridging, no human approval needed.

6. **How much cheaper is this than AWS/cloud providers?** — Batch auction pricing typically yields 60-80% savings vs. on-demand cloud rates by aggregating supply from independent GPU operators and eliminating intermediary margins.

7. **Is my order data private?** — Yes. Orders are encrypted before submission. The protocol uses zero-knowledge proofs to verify execution fairness without exposing any trade details.

8. **What GPU types are supported?** — H100, A100, L40S, and RTX 4090 clusters. Providers list capacity with verifiable hardware attestations.

**Interaction:** Vanilla JS click handlers toggle `max-height` and rotate the chevron icon. Smooth CSS transitions (`transition-all duration-500`). Only one item open at a time (accordion behavior).

**Decorative elements:** Keep the existing violet glow blob behind the section. Add subtle left-border accent on the active/open item (`border-l-2 border-violet-500/50`).

### Files changed

| Action | File |
|--------|------|
| Edit | `public/aero.html` (lines 2679-2827) — Replace pricing section with FAQ accordion + inline JS toggle logic |

