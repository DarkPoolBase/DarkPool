

## Premium Dashboard Overhaul

The current dashboard pages use basic flat cards with minimal styling (`rounded-lg border border-border bg-card`). The landing page has a dramatically richer visual language: glassmorphic surfaces, purple glow effects, backdrop-blur, gradient borders, animated canvas elements, JetBrains Mono labels, micro-interactions, and layered depth. This plan brings that premium aesthetic into the React dashboard.

---

### Design Language to Port

Key visual patterns from the landing page to adopt across all dashboard pages:

- **Glassmorphic cards**: `bg-[#0B0C0E]/80 backdrop-blur-xl border border-white/[0.06] shadow-2xl` instead of flat `bg-card border-border`
- **Gradient border containers**: Outer wrapper with `background: linear-gradient(...)` and inner `bg-[#050505] rounded-[24px]`
- **Purple glow effects**: `shadow-[0_0_20px_rgba(108,60,233,0.3)]` on primary elements, `blur-[80px]` glow blobs behind key sections
- **JetBrains Mono micro-labels**: `text-[10px] uppercase tracking-[0.2em] text-white/40` for section headers
- **Animated pulse dots**: Violet ping dots next to status indicators (like "Node Sync Active")
- **Corner squares / geometric accents**: Small decorative border squares at card corners
- **Hover state transitions**: `group-hover:border-white/10 transition-all duration-500`
- **Shooting line / flashlight mouse-follow effects**

---

### Technical Approach

1. **Install framer-motion** for React-native animations (entrance animations, layout transitions, number counting)
2. **Create shared premium components** that all pages reuse
3. **Rewrite each page** with the new visual language

---

### Step 1: Add framer-motion dependency

Install `framer-motion` for staggered entrance animations, layout transitions, and spring physics.

### Step 2: Create premium shared components

**`src/components/ui/glass-card.tsx`** -- A reusable glassmorphic card with optional glow, gradient border wrapper, corner accents, and entrance animation via framer-motion `motion.div` with `initial={{ opacity: 0, y: 20 }}` and `animate={{ opacity: 1, y: 0 }}`.

**`src/components/ui/section-label.tsx`** -- JetBrains Mono micro-label with animated pulse dot (like the landing page's "Node Sync Active" pattern). Used as section headers throughout.

**`src/components/ui/animated-number.tsx`** -- Spring-animated number counter using framer-motion's `useSpring` + `useTransform` for stats cards, making values count up on mount.

**`src/components/ui/glow-blob.tsx`** -- Absolute-positioned purple blur blob (`blur-[80px] bg-violet-500/10`) for ambient depth behind sections.

### Step 3: Overhaul DashboardLayout, Sidebar, and Header

**DashboardLayout**: Add a subtle radial gradient background overlay and a mouse-following flashlight effect (CSS custom properties, no canvas needed -- `radial-gradient(600px circle at var(--x) var(--y), rgba(139,92,246,0.03), transparent 40%)`).

**DashboardSidebar**: Gradient border accent on the logo area, purple glow behind the logo icon, active nav items get a left violet bar with glow (`shadow-[0_0_12px_rgba(139,92,246,0.8)]`), JetBrains Mono section labels. Subtle hover animations with `transition-all duration-300`.

**DashboardHeader**: Glassmorphic header with `backdrop-blur-md bg-[#030305]/50`, wallet button gets the landing page's purple gradient + glow shadow style, network badge gets a ping dot animation.

### Step 4: Rebuild Dashboard page

- **Stats cards**: Use `GlassCard` with glow blob behind balance card, animated number counting, gradient accent line at top of each card, sparkline mini-chart in the balance card
- **Order table**: Glassmorphic container, row hover effects with `hover:bg-white/[0.03]`, status badges with subtle glow matching their color, primary-colored order IDs
- **Quick Actions**: Buttons with gradient borders, hover glow effects, icon animations
- **Live Feed**: Animated entrance for new items using framer-motion `AnimatePresence`, highlighted items get left purple border with glow, pulse dot for the live indicator
- **Auction Timer**: Large countdown with progress ring (SVG circle animation), urgent state gets amber glow + pulse, Spring-based number transitions

### Step 5: Rebuild Marketplace page

- Order form in a gradient-bordered glass card with inner glow
- Buy/Sell toggle with animated underline slide (framer-motion `layoutId`)
- Market depth chart bars with animated width transitions and hover tooltips
- GPU cards with utilization progress bars that have gradient fills and glow
- Submit button with the landing page's gradient style + loading encryption animation

### Step 6: Rebuild Analytics page

- Price chart container with gradient border wrapper
- Time period buttons with animated active indicator (layoutId)
- Market stats in a grid of mini glass cards with animated numbers
- Utilization bars with gradient fills (`from-violet-500 to-purple-400`) and percentage labels that count up
- Add a decorative canvas or geometric pattern background element

### Step 7: Rebuild Orders, Provider, API Docs, Settings pages

Apply the same glass card treatment, entrance animations (staggered children), and micro-label styling. Expandable rows get smooth height animations. Code blocks in API Docs get the landing page's dark code panel style with syntax highlighting colors.

### Step 8: Add global animations to tailwind config

Add new keyframes and animations:
- `shimmer` -- gradient sweep for loading states
- `glow-pulse` -- pulsing box-shadow for active elements
- `float` -- gentle vertical floating for decorative elements
- `slide-up` -- entrance animation for staggered content
- `border-flow` -- animated gradient border effect

Add global CSS for:
- Custom scrollbar styling (thin, dark, purple thumb)
- Selection color matching the brand
- Smooth scroll behavior

### Step 9: Add page transition animations

Wrap the `<Outlet />` in `DashboardLayout` with framer-motion `AnimatePresence` and page-level `motion.div` for fade + slide transitions between routes.

---

### Summary of Files Changed/Created

| Action | File |
|--------|------|
| Install | `framer-motion` |
| Create | `src/components/ui/glass-card.tsx` |
| Create | `src/components/ui/section-label.tsx` |
| Create | `src/components/ui/animated-number.tsx` |
| Create | `src/components/ui/glow-blob.tsx` |
| Rewrite | `src/components/layout/DashboardLayout.tsx` |
| Rewrite | `src/components/layout/DashboardSidebar.tsx` |
| Rewrite | `src/components/layout/DashboardHeader.tsx` |
| Rewrite | `src/components/dashboard/StatsCard.tsx` |
| Rewrite | `src/components/dashboard/OrderTable.tsx` |
| Rewrite | `src/components/dashboard/QuickActions.tsx` |
| Rewrite | `src/components/dashboard/LiveFeed.tsx` |
| Rewrite | `src/components/dashboard/AuctionTimer.tsx` |
| Rewrite | `src/components/dashboard/OrderStatusBadge.tsx` |
| Rewrite | `src/pages/Dashboard.tsx` |
| Rewrite | `src/pages/Marketplace.tsx` |
| Rewrite | `src/pages/Analytics.tsx` |
| Rewrite | `src/pages/Orders.tsx` |
| Rewrite | `src/pages/Provider.tsx` |
| Rewrite | `src/pages/ApiDocs.tsx` |
| Rewrite | `src/pages/SettingsPage.tsx` |
| Update | `tailwind.config.ts` (new animations) |
| Update | `src/index.css` (scrollbar, selection, utilities) |

