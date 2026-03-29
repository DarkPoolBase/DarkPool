

## Premium Slide Transition for Dashboard Tab Changes

### Current Behavior
- **DashboardLayout**: Page wrapper fades in with subtle `y: 8` shift, fades out on exit
- **GlassCard**: Each tile animates `opacity: 0, y: 20` → `opacity: 1, y: 0` independently with staggered delays

Both feel like a simple fade-up. No directional slide, no coordinated exit.

### New Behavior

**Exit**: All tiles slide out to the left with a stagger (first tile leaves first), scaling down slightly and fading — feels like cards being swept away.

**Enter**: New tiles slide in from the right with a stagger, scaling up from 0.96 to 1 — feels like cards dealing onto the table.

The stagger + directional movement creates a premium "card deck" feel.

### Changes

#### 1. `src/components/layout/DashboardLayout.tsx`
Update the `AnimatePresence` wrapper transition:
- **initial**: `{ opacity: 0, x: 60 }` — new page slides in from right
- **animate**: `{ opacity: 1, x: 0 }`
- **exit**: `{ opacity: 0, x: -60 }` — old page slides out to left
- Use `mode="wait"` instead of `popLayout` so exit completes before enter
- Faster transition: `duration: 0.35` with custom easing `[0.4, 0, 0.2, 1]`

#### 2. `src/components/ui/glass-card.tsx`
Update tile-level animation to complement the page slide:
- Change `initial` from `{ opacity: 0, y: 20 }` to `{ opacity: 0, x: 30, scale: 0.97 }`
- Change `animate` to `{ opacity: 1, x: 0, scale: 1 }`
- Keep staggered `delay` prop so tiles cascade in sequentially
- Use spring-like easing: `[0.25, 0.46, 0.45, 0.94]` (already present)
- Slightly increase duration to `0.55` for a smoother slide feel

This means: page slides in from right → then individual tiles cascade in from right with slight scale, creating layered depth.

### Result
Tab switch → current tiles slide left and vanish → new tiles cascade in from the right with stagger delays → premium card-dealing effect.

