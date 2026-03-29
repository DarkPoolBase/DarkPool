

## Resize Product Detail Bentos to Fill Full Page Width

### Problem
The current layout uses a 2/3 + 1/3 grid (`lg:grid-cols-3` with `lg:col-span-2` for charts). The charts and info sections only fill ~66% of the page, leaving wasted space. Below the order ticket, the left-column bentos continue at 2/3 width with empty space on the right.

### Solution
Restructure the layout so the order ticket sits beside the hero/price chart at the top, and all remaining bento sections span the full page width below.

### Layout Structure

```text
┌─────────────────────────────────┬──────────────┐
│  Price History Chart            │  Order Ticket │
│  (2/3 width)                    │  (1/3, sticky)│
├─────────────────────────────────┴──────────────┤
│  Supply vs Demand  (full width)                 │
├────────────┬────────────┬──────────────────────┤
│  Provider Quality       │  Recent Settlements   │
│  (1/2 width)            │  (1/2 width)          │
├─────────────────────────────────────────────────┤
│  Privacy & Fair Execution (full width, 3-col)   │
└─────────────────────────────────────────────────┘
```

### Changes — `src/pages/ProductDetail.tsx`

1. **Remove `max-w-[1440px]`** from the outer container — let the dashboard layout control max width.

2. **Keep the 3-column grid** (lines 172–400) but move only the Price History chart + Order Ticket into it. End the grid after those two items.

3. **Move the remaining sections** (Supply vs Demand, Provider Quality, Recent Settlements, Privacy) outside the grid so they span full width:
   - Supply vs Demand: full width
   - Provider Quality + Recent Settlements: side by side in a `grid-cols-2` layout
   - Privacy & Fair Execution: full width, keeping its internal 3-column grid

4. **Increase chart heights** from `h-[200px]` to `h-[280px]` for the Supply vs Demand chart since it now has full width.

