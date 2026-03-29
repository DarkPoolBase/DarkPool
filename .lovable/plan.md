

## Add Vertical Spacing to Private Order Bento

### Changes — `src/pages/ProductDetail.tsx`

1. **Line 206**: Change `p-6 space-y-6` → `p-8 space-y-8` (more padding and gaps between all sections)
2. **Line 232**: Change form grid `gap-6` → `gap-8`
3. **Line 234**: Change `space-y-2` → `space-y-3` (GPU Type column)
4. **Line 243**: Change `space-y-3` → `space-y-4` (Quantity column)
5. **Line 262**: Change `space-y-3` → `space-y-4` (Price/Duration column)
6. **Line 288**: Change summary bar `p-4` → `p-5`
7. **Line 210**: Add `mt-1` to Buy/Sell toggle for slight breathing room after the label

All changes scoped to the Private Order `GlassCard` (lines 206–306).

