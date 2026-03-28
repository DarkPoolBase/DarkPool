

## Add "About Us" Section Below Hero with GSAP Scroll Reveals

### What We're Building
A full-width "About Us" section inserted between the hero (line 117) and the "How It Works" section (line 119) in `public/aero.html`. Content is sourced from the uploaded PDF research document. The section uses GSAP ScrollTrigger animations for progressive reveal as the user scrolls.

### Content (from PDF)
Three content blocks with staggered reveals:

1. **The Problem** — AI companies need massive GPU compute but current options are either expensive (AWS at $6+/hr), fully transparent (competitors see your orders), or slow private deals.

2. **Our Solution** — A "dark pool" for compute: encrypted bids, batch auctions every 30-60s, ZK proofs verify fairness, settlement in USDC on Base. Nobody — not even the platform — sees raw order data.

3. **Why It Matters** — $5.7B GPU-as-a-Service market growing 35.8%/yr. Nobody combines privacy + compute + AI agents. The intersection is completely greenfield.

### Design
- Matches the existing glassmorphic dark aesthetic (bg-[#030303], white/50 text, JetBrains Mono labels)
- Section header with uppercase tracking label ("ABOUT THE PROTOCOL") and large light headline
- Three glass cards in a row (lg:grid-cols-3) with subtle borders (white/[0.06]) and backdrop-blur
- Each card has a monospace category label, heading, and body text
- Optional: a key stats strip below (market size, growth rate, competitors)

### GSAP Animations
- Section headline: fade-up with `ScrollTrigger` (start: "top 85%")
- Cards: staggered fade-up (0.15s stagger, power3.out easing)
- Stats strip: counter animation on scroll entry
- All using the existing GSAP + ScrollTrigger already loaded in the page

### Technical Details

| Action | File | Details |
|--------|------|---------|
| Edit | `public/aero.html` (after line 117) | Insert ~80 lines of HTML for the About Us section + GSAP scroll animation script block |

The section HTML will be inserted between `</section>` (line 117) and `<section ... id="how-it-works">` (line 119). A `<script>` block at the end of the section will initialize GSAP ScrollTrigger animations for the `.about-reveal` elements, using the same pattern as the existing reveal animations.

