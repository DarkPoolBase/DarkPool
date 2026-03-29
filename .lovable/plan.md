

## Redesign Private Order Section

### Problem
The current Private Order ticket (lines 205–295) is a 4-column grid that feels cramped and poorly structured — the columns don't have clear visual hierarchy, the Buy/Sell toggle is squeezed alongside GPU info, and the Est. Total / Submit area lacks prominence.

### New Design

```text
┌─────────────────────────────────────────────────────────────┐
│  PRIVATE ORDER                                               │
│                                                              │
│  ┌─────────── BUY ──────────┬─────────── SELL ─────────────┐│
│  │          (full-width animated toggle)                     ││
│  └───────────────────────────┴──────────────────────────────┘│
│                                                              │
│  ┌──── GPU Type ────┬──── Quantity ────┬──── Price/Dur ────┐ │
│  │ H100 · 80GB HBM3 │ Slider + presets │ Price + Duration  │ │
│  └──────────────────┴─────────────────┴───────────────────┘ │
│                                                              │
│  ┌──── Summary Bar ────────────────────────────────────────┐ │
│  │ 24 GPU-hrs × $0.21 = $5.04 USDC  [Submit Encrypted Order]│ │
│  └─────────────────────────────────────────────────────────┘ │
│  Orders remain encrypted until verified settlement.          │
└─────────────────────────────────────────────────────────────┘
```

### Changes — `src/pages/ProductDetail.tsx` (lines 205–295)

1. **Full-width Buy/Sell toggle** — Move out of the 4-col grid, make it a standalone row at the top with larger touch targets (`py-3`, `text-base`).

2. **3-column form grid** — Replace the 4-col layout with a cleaner 3-column grid:
   - **Col 1**: GPU type card (name + VRAM + market label)
   - **Col 2**: Quantity slider with preset buttons
   - **Col 3**: Price input + Duration select (stacked)

3. **Summary + Submit bar** — A full-width bottom row with:
   - Left: breakdown text like "24 GPU-hrs × $0.21/hr"
   - Center: Est. Total prominently displayed
   - Right: Submit button (full gradient CTA)
   - Below: privacy note centered

4. **Consistent 8-point spacing** — `gap-6` between major sections, `space-y-4` within columns, `p-6` card padding.

