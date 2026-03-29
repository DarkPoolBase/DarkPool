

# Widen All Sections by ~11%

## Change

Replace `max-w-6xl` (1152px) with `max-w-7xl` (1280px) everywhere — a standard Tailwind breakpoint that's ~11% wider.

No other changes to spacing, colors, copy, or layout.

## Files

### `public/aero.html` (~14 occurrences)
- Hero `#core-section`: `max-w-6xl` → `max-w-7xl`
- About section containers (4 instances): `max-w-6xl` → `max-w-7xl`
- Why Privacy `#main-container` + outer container: `max-w-6xl` → `max-w-7xl`
- Why Privacy details `#wpm-details`: `max-w-6xl` → `max-w-7xl`
- Capabilities `#how-it-works`: `max-w-6xl` → `max-w-7xl`
- Roadmap: `max-w-6xl` → `max-w-7xl`
- FAQ header + accordion: `max-w-6xl` → `max-w-7xl`
- CTA: `max-w-6xl` → `max-w-7xl`
- Footer (2 instances): `max-w-6xl` → `max-w-7xl`

### React pages (6 files, 1 change each)
- `Dashboard.tsx`, `Marketplace.tsx`, `Orders.tsx`, `Analytics.tsx`, `Provider.tsx`, `ApiDocs.tsx`, `SettingsPage.tsx`, `ProductDetail.tsx`: `max-w-6xl` → `max-w-7xl`

