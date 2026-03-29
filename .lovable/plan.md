

# Reposition 01 Section Header to Match Reference Layout

## What changes

The reference image shows a two-column layout where:
- **Left column**: Small section label (`/01 OUR PURPOSE` style) positioned top-left
- **Right column**: Large heading text taking up the majority of the width, with a subheading/description below in a lighter color

Currently the 01 section (`#about`) stacks everything vertically — section number, label, heading, and paragraph all in a single column.

## Implementation

**File: `public/aero.html` (lines 229–239)**

Replace the current stacked `.about-header` with a two-column grid layout:

```text
┌──────────────┬─────────────────────────────────────────────┐
│ /01          │  Privacy-first compute for the agentic      │
│ ABOUT THE    │  era. Buying compute shouldn't mean         │
│ PROTOCOL     │  broadcasting your strategy to the world... │
│              │                                             │
└──────────────┴─────────────────────────────────────────────┘
```

- Wrap in `grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 items-start`
- Left column: section number + label (mono, small, uppercase, white/30)
- Right column: the `<h2>` heading and `<p>` description
- The heading text remains the same size/weight; the paragraph stays below it
- On mobile, falls back to single column (label on top)

No changes to copy, colors, fonts, or anything outside lines 229–239.

