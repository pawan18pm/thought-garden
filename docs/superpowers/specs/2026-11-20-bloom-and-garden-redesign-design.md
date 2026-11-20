# Bloomed-today + Garden redesign — design (approved 2026-11-20)

**Why:** On-device testing showed (1) "Bloomed today" — the most rewarding moment — sat at the bottom of the Plant list as plain text; (2) the top of the Plant tab (tiny ⚙︎ gear, a grey "Good morning · N plants growing" line) was hard to read and Settings was hard to find; (3) the Garden calendar (small dots and emoji) did not match the agreed "calendar of plants" idea.

**Approved mockups (the visual source of truth):** `docs/superpowers/specs/mockups/PlantTop.dc.html`, `Garden.dc.html`, `GardenDay.dc.html` (390×844 iPhone frames; also on the style board artboards PlantTop / Garden / GardenDay). Match their layout, sizes, colors and copy. Mockup sample data (names, counts) is illustrative only.

## Goals
- Plant tab top: greeting row (sun/moon icon + greeting) with a labeled **Settings** pill at right; big "Plant" title; two summary chips ("N growing", "N bloomed today").
- **Bloomed today card at the top**, above the beds: pink offset shadow, count badge, a row of bloomed flowers (flower in the plant's bed shade, bed-colored label), soil strip, rewarding line that changes with the count. Tap a flower → existing undo-bloom confirm. Badge pops when the count goes up (skipped with Reduce Motion).
- Garden tab: title + subtitle, **This week** card of 7 soil tiles, **month card** of soil tiles with plant art, legend.
- Day detail: custom header (‹ Garden pill, day tile, title, summary line) and section cards.

## Non-goals
No new features, no schema change, no new dependencies, no change to how stages/blooms work, no streaks.

## Decisions (mine, approved with the mockups)
- Strong flower shades per bed color: blue `#7FA8E8`, orange `#F2A36B`, purple `#B49AF0`, yellow `#F2CF4A`, green `#8ACB72`, pink `#F28AA8`; Ideas bed → pink `#F28AA8`.
- A day shows its highest stage: bloomed > watered > planted > empty (existing `dayState`).
- A bloomed day's flower uses the bed color of the **earliest** bloom that day.
- Empty Bloomed-today state stays at the top as a compact card: "Your first bloom today is one tap away 🌱".
- Rewarding line: 1 → "1 thought bloomed. Nice start." · 2–3 → "N thoughts bloomed. Nice work." · 4+ → "N thoughts bloomed. You're on a roll!" followed by muted "Tap one to undo."
- Many blooms: the flower row scrolls horizontally.

## Approaches considered
1. **Restyle in place + one small data addition (chosen):** reuse PlantArt, tokens, existing repos; add bloom color per day to activity queries. Smallest change, matches mockups.
2. Render mockup SVGs as images — rejected: no per-bed color, not dynamic.
3. Calendar library — rejected: new dependency, fights the soil-tile look.
