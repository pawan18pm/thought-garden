# Thought Garden v6 — design (approved 2026-11-26)

**Visual source of truth:** the connected prototype `V6App` on the board "Thought Garden Style Board v3" (design board, private; artboard V6App, 390×844). Match its layout, copy and behaviour. Sample names in it are illustrative.

## Why
On-device and board reviews (2026-11-26) showed the app should be minimal and timespent-like: white space, big bold titles, one card per bed with a coloured offset shadow, a Duolingo-paced onboarding, and a Plant tab where planting is instant. The user's own beds must flow from onboarding into every screen.

## Goals
1. **Rename** the app from "Mindbed" to **Thought Garden** (app name, visible copy, docs). Final name, confirmed by the user.
2. **Onboarding** (one question per screen, progress bar): Welcome note → What are you growing (5 cards incl. "Something else" = start blank) → Make your beds (rename, recolor, remove, add by typing or idea chips, "Clear all and start blank", Skip) → First thought banner (empty textarea, bed chips = the user's beds only, "Plant it in {bed}", disabled until typed) → Daily nudge (Morning 8:00 / Evening 9:00, Not now) → Plant tab.
3. **Plant tab:** logo row (Thought Garden + gear → Settings), "Plant" title with "N growing · N bloomed" summary, an always-open **quick-plant box** (input, bed chips, Plant button, Enter plants, "Planted in X" confirmation), "Your beds" with **Edit beds** (rename, recolor, add, remove; removing a bed with thoughts asks: move to another bed / delete / cancel). Each bed card lists its thoughts; each row = plant art, title, **3 drops**, **Water** button and a small **flower button** (Bloom now) once watered ≥1. Bloomed rows show the flower and a "Bloomed" tag.
4. **Water/Bloom rule:** a thought **auto-blooms on its 3rd water**; Bloom now is available after ≥1 water. Art: 0 seed, 1 sprout, 2 growing, bloom = flower in bed colour.
5. **Garden tab:** logo row, "Garden" title, **Next up** card (thirsty / ready counts → Plant tab), month card: summary chips (bloomed / watered / planted, no double counting) + encouraging line, **soil-tile calendar** (date number, plant art grown in soil, flower + sparkle + pink glow on bloom days, soft soil on rest days, dashed future days, green ring today), legend with plant art. Tap a day → dropdown with counts and each thought once under Bloomed / Watered / Planted (with bed tag).
6. **Settings:** Manage beds (rename, recolor, move up, thought counts), Daily reminder switch + time, Who are you, Privacy, About, Reset all data (confirm).

## Non-goals
No new features beyond the prototype: no notes per water, no next steps, no due dates, no streaks, no login, no sync. No paid Apple distribution.

## Constraints
- Expo SDK 58, Expo Router, SQLite, zustand store, PostHog analytics (actions only, never thought text). Must keep working in **Expo Go** on iPhone.
- **No schema change**: beds, plants, waterings and bloomed_at already hold everything.
- Existing tests keep passing or are updated to the new copy/flow.

## Approaches
1. **Restyle and rewire the existing screens (chosen):** reuse the store, repos, PlantArt, tokens and routes; replace screen layouts and copy to match V6App; add the auto-bloom rule in the store. Smallest change, keeps data and tests.
2. Rewrite the app from scratch around the prototype: rejected, throws away working data/notification/analytics code.
3. Embed the prototype HTML in a web view: rejected, not a real app, no SQLite, poor on iPhone.

## Builder's calls (mine, flagged for review)
- The legacy hidden **Ideas** bed stays as an internal fallback but is **not shown** when empty; the quick-plant box always targets a chosen user bed.
- Priority stakes stay in the data model and the existing thought detail sheet (tap a thought), but are **not shown** on rows or in planting, per the minimal design.
- Persona cards in onboarding map to existing personas (Studies → student, A new job → jobPrep, My work → professional, My own ideas → builder) plus "Something else" (no suggested beds).

## Later steps (separate plans)
Security review before the repo goes public; web support + Expo Hosting deploy; public GitHub README.
