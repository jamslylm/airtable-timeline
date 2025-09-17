# Airtable Timeline — Implementation Notes

## How to run

- Requirements: Node 18+
- Install dependencies:
  - `npm install`
- Start the dev server (Parcel):
  - `npm start`
- Your browser should open automatically. If it doesn’t, navigate to `http://localhost:1234`.

The app renders the sample data from `src/timelineItems.js` and shows a multi‑lane timeline.

## What I like about this implementation

- Simple, readable React components with minimal state.
- Deterministic lane assignment via `assignLanes(items, { minGapDays })` with a compacting heuristic.
- Responsive zoom control (pixels/day) that reflows layout smoothly.
- Clean visual design with improved readability for ticks and item labels, including adaptive display of date metadata.
- No heavy timeline libraries; uses `date-fns` for date math only.

## What I would change if I were to do it again

- Improve accessibility (keyboard controls for navigation and editing, ARIA roles for timeline semantics).
- Add vertical lane labels or grouping, and a mini‑map for large ranges.
- Persist user edits (e.g., to localStorage) and provide an undo stack.
- Implement collision-aware drag preview and optional snapping to week/month.

## Design decisions

- Lane assignment: Greedy packing per lane using `minGapDays` so short labels have breathing room when zoomed out. The gap is derived from zoom (`minGapDays = Math.max(0, Math.floor(40 / pixelsPerDay))`).
- Date math: `date-fns` for clarity and reliability; timeline bounds pad ±7 days for context.
- Rendering: Pure CSS/HTML for items, adaptive label visibility (dates hidden on narrow items) to prioritize readability.
- Tooling: Parcel for zero‑config dev server; React 18 for UI.

## How I would test with more time

- Unit tests for `assignLanes` covering overlapping edges, identical boundaries, and varying `minGapDays`.
- Snapshot/DOM tests for `Timeline` tick generation across zoom levels and date ranges.
- Interaction tests (once implemented) for drag/resize and inline editing.
- Visual regression tests for CSS at different zoom scales and narrow items.

## Notes on enhancements

- Implemented: Zoom in/out via range input; drag to move items; resize handles to adjust start/end; inline name editing (double-click, Enter to commit, Esc to cancel); single-click selection opens a modal popup with backdrop and a top-right close button. Drag uses pageX with scroll correction, a 4px activation threshold, and snaps to whole days based on the current zoom.
- Future improvements: Keyboard accessibility for move/resize and selection, undo stack, persistence (e.g., localStorage), and smarter collision avoidance/preview during drag.

## How to use

- Zoom: Use the slider in the header. Labels, lane packing, and ruler tick labels (MMM d, yyyy) adapt to zoom.
- Select: Single-click an item to open a details popup; click outside on the dark backdrop or hit the close button (×) to dismiss.
- Edit name: Double-click an item name to edit inline. Press Enter to commit, Esc to cancel, or blur to commit.
- Move: Click and drag the body of an item to shift its date range. Movement snaps to days; small accidental movements under 4px won’t trigger a drag.
- Resize: Drag the left/right edge handles to adjust start/end dates. The range is clamped so start is never after end (swap-safe).

## Files of interest

- `src/index.js`: App shell, zoom state, lane computation.
- `src/timeline.js`: Ruler and lane rendering; width calculations; modal details popup with backdrop and close button; passes callbacks.
- `src/TimelineItem.js`: Item bar rendering with adaptive meta visibility; drag/move/resize; inline edit; click-to-select with drag suppression.
- `src/assignLanes.js`: Lane packing algorithm with `minGapDays` option.
- `src/app.css`: Styles for timeline, ruler, items, and readability tweaks.
