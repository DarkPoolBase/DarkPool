

## Plan: Revert Font & Restore Original 3-Tier Section

### 1. Revert font to Inter across the entire project

**Files to change:**
- **`src/index.css`**: Remove the `@font-face` for Kavo Sans. Change body font-family back to `'Inter', sans-serif`. Keep the existing JetBrains Mono import, add Inter import.
- **`tailwind.config.ts`**: Change `sans` font stack from `['Kavo Sans', 'cursive']` back to `['Inter', 'sans-serif']`.
- **`public/aero.html`**: Remove the Kavo Sans `@font-face` block. Replace all `font-['Kavo_Sans']` classes with `font-['Inter']`. The Inter font link is already loaded (line 22).

### 2. Replace the "How it works for buyers & sellers" sidebar accordion section with the original 3-tier layout

The current section (lines ~246-780) uses a sticky sidebar with accordion navigation + large content panels. This will be replaced with the original simple 3-column grid layout featuring three cards:

- **AGENTS** — AI agents submit encrypted GPU orders
- **AUCTIONS** — Batch auctions find fair clearing prices  
- **ON-CHAIN** — Instant settlement on Base L2

The replacement will be a clean 3-column grid section matching the dark glassmorphic design system, with each card containing an icon, title, and description. The premium glassmorphic "Buyers & Sellers" section below (lines ~2258-2496) will remain unchanged as it is a separate section.

### Technical details

- The Inter font is already loaded via Google Fonts link on line 22 of `aero.html`
- The `@font-face` block for Kavo Sans (lines 8-14) and the `public/fonts/Kavo-Sans.woff2` file will no longer be needed
- The sidebar accordion section spans roughly lines 246-780 in `aero.html` and will be replaced with a compact 3-column grid

