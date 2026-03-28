

## Replace "Visual Component Architecture" with Protocol Telemetry Dashboard

### Problem
Lines 1494-1801 in `public/aero.html` show a generic design-tool section ("Visual Component Architecture") with irrelevant metrics (Components: 1,024, Lighthouse: 100%, Variants: 256, TTFB: 45ms) and a placeholder chart. This has no relevance to the GPU dark pool protocol.

### Replacement: "Dark Pool Telemetry"

**Header area:**
- Pulsing dot label: `Protocol Live` (replaces "Node Sync Active")
- Title: `Dark Pool Telemetry` (replaces "Visual Component Architecture")

**Stats bar** (4 metrics, same layout):
| Old | New | Value |
|-----|-----|-------|
| Components: 1,024 | Orders Matched | 12,847 |
| Lighthouse: 100% | Fill Rate | 94% |
| Variants: 256 | Active Agents | 1,892 |
| TTFB: 45ms | Settlement | 1.2s |

**Description banner:**
- Text: "Real-time protocol telemetry across all active batch windows. Monitoring order flow, fill rates, and settlement performance on Base L2."
- Button: "Launch Terminal" (replaces "Start Building"), links to `/dashboard`

**Legend labels** (below chart):
- Layouts → Order Flow
- Interactions → Fill Rate  
- Styles → Settlement

**Dropdown buttons:**
- "Project: Alpha" → "Network: Base L2"
- "Auto-saved" → "Live Sync"

**Timeline labels:**
- Keep the T-12:00 through PRESNT format — works well for protocol telemetry

**Chart colors:** Change from cyan/blue to violet/emerald to match the site's accent palette:
- Line 1: `rgba(139, 92, 246, 0.9)` (violet) with violet gradient fill
- Line 2: `rgba(34, 197, 94, 0.6)` (emerald) with emerald gradient fill
- Line 3: Keep the subtle gray line

### Files changed

| Action | File |
|--------|------|
| Edit | `public/aero.html` (lines 1494-1801) — Replace text content and chart colors, preserve structure and animations |

### Approach
Text-only replacements plus chart color updates. The section structure, canvas animation logic, GSAP scroll triggers, and glassmorphic styling all remain intact.

