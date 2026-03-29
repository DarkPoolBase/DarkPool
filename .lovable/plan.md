

## Make Price History Full-Width and Redesign Order Ticket Below It

### Problem
The Price History chart sits in a 2/3 column with the Order Ticket beside it, leaving empty space below the chart. The Order Ticket is a tall sticky sidebar creating visual imbalance.

### New Layout

```text
┌─────────────────────────────────────────────────┐
│  Price History Chart (full width, taller)        │
├─────────────────────────────────────────────────┤
│  Order Ticket — horizontal redesign (full width) │
│  ┌──────────┬──────────┬──────────┬────────────┐│
│  │ BUY/SELL │ Quantity │ Price    │ Submit Btn  ││
│  │ toggle   │ + preset │ + dur.  │ + est total ││
│  └──────────┴──────────┴──────────┴────────────┘│
├─────────────────────────────────────────────────┤
│  Supply vs Demand (full width)                   │
│  ... rest unchanged ...                          │
└─────────────────────────────────────────────────┘
```

### Changes — `src/pages/ProductDetail.tsx`

1. **Price History** — Remove the `lg:grid-cols-3` wrapper. Make the chart a standalone full-width `GlassCard` with height increased to `h-[280px]`.

2. **Order Ticket** — Redesign as a full-width horizontal card below the chart:
   - Use a `grid grid-cols-1 md:grid-cols-4 gap-6` layout inside a single `GlassCard`
   - **Column 1**: BUY/SELL toggle + GPU type display
   - **Column 2**: Quantity slider with preset buttons
   - **Column 3**: Price input + Duration select
   - **Column 4**: Est. Total, Submit button, privacy note
   - Remove `sticky top-8` since it's no longer a sidebar
   - Keep the same animated BUY/SELL toggle, same styling tokens

3. No changes to sections below (Supply vs Demand, Provider Quality, Settlements, Privacy).

### Technical Details

| Action | Location | Details |
|--------|----------|---------|
| Edit | Lines 172–299 | Replace the `lg:grid-cols-3` grid with two sequential full-width `GlassCard` blocks |
| Increase | Chart height | `h-[200px]` → `h-[280px]` |
| Redesign | Order ticket | Horizontal 4-column grid layout inside single card |

