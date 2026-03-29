

# Consistent Layout: max-w-[1200px] + mx-auto + px-6

## Problem

Container widths are inconsistent across the site:

| Section | Current max-width |
|---------|------------------|
| Hero (`#core-section`) | `max-w-7xl` (1280px) |
| About | `max-w-5xl` (1024px) / `max-w-6xl` (1152px) |
| Why Privacy | `max-w-[1280px]` |
| Capabilities | `max-w-screen-2xl` (1536px!) |
| Roadmap | `max-w-[1280px]` |
| FAQ header | no max-width container |
| FAQ accordion | `max-w-6xl` (1152px) |
| CTA | `max-w-[720px]` |
| Footer | `max-w-6xl` (1152px) |
| Dashboard pages | `max-w-[1440px]` |
| Settings | `max-w-[800px]` |
| API Docs | `max-w-[960px]` |

Content edges don't align vertically between sections.

## Plan

### 1. Landing page (`public/aero.html`)

Standardize all section containers to `max-w-[1200px] mx-auto px-6`:

- **Hero** (`#core-section`): Change `max-w-7xl` → `max-w-[1200px]`, normalize padding to `px-6`
- **About** (`#about`): Change all inner containers (`max-w-5xl`, `max-w-6xl`) → `max-w-[1200px]`, set `px-6`
- **Why Privacy** (`#why-privacy`): Change `max-w-[1280px]` → `max-w-[1200px]`, and bento `#main-container` similarly, set `px-6`
- **Capabilities** (`#how-it-works`): Change `max-w-screen-2xl` → `max-w-[1200px]`, set `px-6`
- **Protocol** (`#quant-analytics`): Already inside `#core-section`, inherits the container — verify alignment
- **Roadmap**: Change `max-w-[1280px]` → `max-w-[1200px]`, set `px-6`
- **FAQ**: Wrap header and accordion in a single `max-w-[1200px] mx-auto px-6` container; remove the separate `max-w-6xl` on the accordion
- **CTA**: Keep the glassmorphic card narrower (design choice) but wrap outer container at `max-w-[1200px] mx-auto px-6`
- **Footer**: Change `max-w-6xl` → `max-w-[1200px]`, set `px-6`
- **Nav**: Content area stays full-width (fixed nav is intentionally edge-to-edge)

Remove all `md:px-10`, `md:px-12` overrides — just use `px-6` consistently.

### 2. Dashboard app pages (React)

Standardize all page wrappers to `max-w-[1200px]`:

- **Dashboard.tsx**: `max-w-[1440px]` → `max-w-[1200px]`
- **Marketplace.tsx**: `max-w-[1440px]` → `max-w-[1200px]`
- **Orders.tsx**: `max-w-[1440px]` → `max-w-[1200px]`
- **Analytics.tsx**: `max-w-[1440px]` → `max-w-[1200px]`
- **Provider.tsx**: `max-w-[1440px]` → `max-w-[1200px]`
- **SettingsPage.tsx**: `max-w-[800px]` → `max-w-[1200px]`
- **ApiDocs.tsx**: `max-w-[960px]` → `max-w-[1200px]`
- **ProductDetail.tsx**: Add `max-w-[1200px]` (currently has none)

Note: Dashboard pages already get `px-6` from `DashboardLayout`'s `<main>` padding (`p-4 md:p-6 lg:p-8`), so no padding changes needed on inner wrappers.

### 3. Post-change audit

After all changes, verify alignment by checking every section's effective content edges are identical at `1200px` max with `24px` (px-6) side padding.

### Files modified
- `public/aero.html` — ~15-20 container class changes
- `src/pages/Dashboard.tsx` — 1 class change
- `src/pages/Marketplace.tsx` — 1 class change
- `src/pages/Orders.tsx` — 1 class change
- `src/pages/Analytics.tsx` — 1 class change
- `src/pages/Provider.tsx` — 1 class change
- `src/pages/SettingsPage.tsx` — 1 class change
- `src/pages/ApiDocs.tsx` — 1 class change
- `src/pages/ProductDetail.tsx` — 1 class change

