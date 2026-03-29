

## Fix Double Borders and Alignment Issues Across All Dashboard Tabs

### Problem
Multiple pages have visual double-border artifacts and inconsistent alignment caused by:
- Inner elements with explicit `border border-white/[0.06]` nested inside already-bordered `GlassCard` containers
- CSS `.glass-card` utility class in `index.css` having `::before` and `::after` pseudo-elements that add highlight lines (top and left edges) — these can conflict when combined with the component's own border
- Table rows carrying default `border-b` from the base `TableRow` component
- The `corners` prop on `GlassCard` adding extra decorative border pieces that clash
- Inconsistent use of `border-white/[0.04]` vs `border-white/[0.06]` across pages

### Changes

#### 1. `src/index.css` — Remove glass-card pseudo-element borders
Remove the `::before` (top highlight line) and `::after` (left highlight line) from the `.glass-card` CSS class. These create a subtle double-border effect on any element using this utility class. The `GlassCard` component already handles its own border via Tailwind.

#### 2. `src/components/ui/glass-card.tsx` — Remove `corners` prop visual clutter
The `corners` prop adds 4 tiny border elements at corners that create a double-border look. Remove the corners rendering entirely since no page truly benefits from them visually.

#### 3. `src/pages/Dashboard.tsx` — No structural changes needed
The Dashboard page uses GlassCard cleanly. Only affected by the global fixes above.

#### 4. `src/pages/Orders.tsx` — Clean up table borders
- Remove `corners` from the GlassCard (line 57)
- Standardize `TableRow` border classes to `border-white/[0.04]` consistently
- Remove redundant `border-b` on the default `TableRow` that doubles up with the component default

#### 5. `src/pages/Analytics.tsx` — Remove corners prop
- Remove `corners` from both Market Statistics and GPU Utilization GlassCards (lines 108, 121)

#### 6. `src/pages/Marketplace.tsx` — Clean up product card borders
- Standardize the footer `border-t` to match the card's border opacity
- Ensure inner elements don't add extra borders that stack with the card border

#### 7. `src/pages/ProductDetail.tsx` — Remove inner double borders
- Inner stat boxes (lines 151-168) use `bg-white/[0.03]` — remove any redundant borders on nested elements that sit right against the GlassCard edge
- Order ticket summary bar (line 296) has `border border-white/[0.06]` inside an already-bordered GlassCard — remove the border, keep just the background
- Supply vs Demand, Provider Quality inner elements — remove explicit borders on nested boxes, keep only `bg-white/[0.03]` for subtle differentiation

#### 8. `src/pages/Provider.tsx` — Clean up nested borders
- Remove `gradient` and `corners` props from GlassCards (lines 24, 142)
- Inner stat boxes (lines 175, 225) have `border border-white/[0.06]` — remove borders, keep background only
- GPU identity box (line 157), Current Job box (line 186), Stake box (line 89), Recent Payouts container (line 235) — remove explicit borders to prevent doubling with parent GlassCard
- Standardize all inner containers to use `bg-white/[0.03]` without borders

#### 9. `src/pages/SettingsPage.tsx` — Remove corners prop, clean nested borders
- Remove `corners` from GlassCards (lines 16, 58)
- API key inner boxes (line 39) have `border border-white/[0.06]` inside a bordered GlassCard — remove inner borders
- Notification rows `border-b border-white/[0.04]` — keep as dividers but ensure consistency

#### 10. `src/components/dashboard/StatsCard.tsx` — No changes needed
Uses GlassCard cleanly with `p-0` and no nested bordered elements.

#### 11. `src/components/dashboard/OrderTable.tsx` — Clean table row borders
- Standardize `TableRow` border to single consistent `border-white/[0.04]`

### Alignment Standardization
- All pages already use `space-y-8` for main vertical rhythm — verify consistency
- Ensure all GlassCard padding is consistently `p-6` (or `p-7` for the Provider page form)
- Inner grid gaps standardized to `gap-4` for stat grids, `gap-6` for section grids

### Technical Summary

| File | Changes |
|------|---------|
| `src/index.css` | Remove `::before` and `::after` from `.glass-card` |
| `src/components/ui/glass-card.tsx` | Remove `corners` prop and its rendering |
| `src/pages/Orders.tsx` | Remove `corners`, clean table borders |
| `src/pages/Analytics.tsx` | Remove `corners` from 2 cards |
| `src/pages/ProductDetail.tsx` | Remove inner element borders on ~6 nested containers |
| `src/pages/Provider.tsx` | Remove `gradient`/`corners`, remove inner borders on ~8 containers |
| `src/pages/SettingsPage.tsx` | Remove `corners`, remove inner borders on API key boxes |
| `src/pages/Marketplace.tsx` | Standardize product card footer border |
| `src/components/dashboard/OrderTable.tsx` | Standardize row borders |

