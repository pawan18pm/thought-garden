# Bloomed-today + Garden Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make "Bloomed today" a rewarding card at the top of the Plant tab with a clearer header, and redesign the Garden calendar + day detail to the approved mockups.

**Architecture:** Restyle existing screens in `thought-garden/src`, reusing `PlantArt`, `tokens`, and repos. One additive data change: activity queries return the bloom color per day.

**Tech Stack:** Expo SDK 58, React Native, TypeScript, expo-router, react-native-svg, reanimated 4 (mocked in jest), jest-expo + RNTL v14 (async `render`/`fireEvent`).

**Spec:** `docs/superpowers/specs/2026-11-20-bloom-and-garden-redesign-design.md` (+ mockups in `docs/superpowers/specs/mockups/`).

## Global Constraints
- App code lives in `thought-garden/`; run `npx jest` and `npx tsc --noEmit` there. Both must stay green (baseline: 25 suites / 133 tests).
- No new dependencies. No DB schema change.
- Visual source of truth = the mockup `.dc.html` files. Colors only from `ui/tokens.ts` (add new tokens there). Fonts: `fonts.titleXBold` / `titleBold` / `body` / `bodySemi`.
- Neo-brutalist style: 2px ink borders, offset shadows done as a sibling/underlay View or `shadowOffset` with `shadowOpacity: 1, shadowRadius: 0` (iOS).
- Tap targets ≥ 44pt. Every Pressable has `accessibilityRole` + `accessibilityLabel`.
- Animations respect `useReducedMotion` from `@/ui/useReducedMotion`.
- Flower shades: blue `#7FA8E8`, orange `#F2A36B`, purple `#B49AF0`, yellow `#F2CF4A`, green `#8ACB72`, pink `#F28AA8`; Ideas → `#F28AA8`.
- Keep analytics events unchanged (`garden_viewed` on focus only, `day_opened`).
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus
1. Zero blooms today → compact empty card at top, no crash, no blank gap.
2. 8+ blooms today → flower row scrolls horizontally; text labels truncate (1 line).
3. Week spanning two months (e.g. Mon 30 Nov – Sun 6 Dec) → week tiles show correct states for both months.
4. A bloomed plant in the Ideas bed (`color: 'ideas'`) → pink flower, white label, no crash.
5. Undoing a bloom from the card → card count and garden tile update (store already refreshes `bloomedToday`).

---

### Task 1: Plant tab top panel + Bloomed today card

**Files:**
- Modify: `src/ui/tokens.ts` (add `flowerColors: Record<BedColorKey | 'ideas', string>` and `pink: '#F28AA8'` accent)
- Create: `src/domain/bloomCopy.ts` — `bloomLine(n: number): string`
- Create: `src/features/plant/BloomedTodayCard.tsx` (replaces `BloomedTodayRow.tsx`; delete the old file)
- Create: `src/features/plant/PlantHeader.tsx` (greeting row + Settings pill + title + chips)
- Modify: `src/app/(tabs)/plant.tsx` (header → `PlantHeader`; card in `ListHeaderComponent` above beds; remove footer)
- Test: `src/domain/__tests__/bloomCopy.test.ts`, `src/features/plant/__tests__/BloomedTodayCard.test.tsx`, add a `flowerColors` assertion to `src/ui/__tests__/tokens.test.ts`

**Interfaces:**
- Produces: `flowerColors` in tokens (Task 2 uses it); `bloomLine(n)`.
- `BloomedTodayCard({ plants: Plant[]; beds: Bed[]; onUndo: (id: string) => void })`.
- `PlantHeader({ hour: number; growing: number; bloomedToday: number })` — Settings pill is `<Link href="/settings" asChild>` with label "Settings".

- [ ] **Step 1: Failing tests**
  - `bloomLine(1) === '1 thought bloomed. Nice start.'`, `bloomLine(2) === '2 thoughts bloomed. Nice work.'`, `bloomLine(3)` → "Nice work.", `bloomLine(4) === "4 thoughts bloomed. You're on a roll!"`.
  - Card with `[]` renders text `Your first bloom today is one tap away 🌱` and no badge.
  - Card with 3 plants renders title "Bloomed today", badge "3", one button per plant labelled `Bloomed: <text>`, line from `bloomLine(3)` and "Tap one to undo."; pressing a flower calls `Alert.alert` and choosing "Undo bloom" calls `onUndo(id)` (keep existing alert copy).
  - Ideas-bed plant renders without crashing (flower uses `flowerColors.ideas`).
  - `flowerColors.purple === '#B49AF0'`, `flowerColors.ideas === '#F28AA8'`.
- [ ] **Step 2: Run, verify fail** — `npx jest bloomCopy BloomedTodayCard tokens`
- [ ] **Step 3: Implement** per mockup `PlantTop.dc.html`:
  - Header row: left = icon (sun for hours 5–16, moon otherwise; small react-native-svg) + `greetingFor(hour)` (15, bodySemi, ink); right = Settings pill (h44, white, 2px ink border, 999 radius, 2px ink offset shadow, gear glyph + "Settings").
  - Title "Plant" 44 titleXBold; chips "N growing" / "N bloomed today" (white pill, 2px border, 13 bodySemi). Pluralization not needed for chips.
  - Card: white, 2px border, radius 22, 4px pink offset shadow; header "Bloomed today" (22 titleXBold) + pink count badge (min 32 circle); horizontal `ScrollView` of flowers (`PlantArt stage="bloom" size≈64 flowerColor=flowerColors[bed.color]` + bed-colored label, 1 line, max width ~96); 12px soil strip (`colors.soil`, top border); footer line `bloomLine(n)` bold + " Tap one to undo." muted.
  - Empty: same card frame, no badge/flowers/soil; single line copy above, padding 14/16.
  - Badge pop: reanimated scale 1→1.25→1 when count increases vs previous render; none when reduced motion.
- [ ] **Step 4: Run tests + tsc** — all green.
- [ ] **Step 5: Commit** `feat(plant): bloomed-today card at top and clearer header`

### Task 2: Garden redesign (week card, soil-tile month, day detail)

**Files:**
- Modify: `src/db/repos.ts` — add `activity.range(startKey: string, endKey: string): Promise<Record<string, DayActivity & { bloomColor?: BedColorKey | 'ideas' }>>` (inclusive day keys); reimplement `month()` via `range()`; keep `week()` and `detail()`.
- Modify: `src/features/garden/useActivity.ts` — returns `{ cells: Record<string, DayCell>, weekCells: Record<string, DayCell>, week, reload }` where `DayCell = { state: DayState; flower?: string }` (flower = hex from `flowerColors`). Week cells come from `range(weekStart, weekEnd)` so weeks spanning months work.
- Create: `src/features/garden/SoilTile.tsx` — `SoilTile({ cell?: DayCell; label?: string; dayNum?: number; isToday: boolean; future: boolean; size: 'week' | 'month' })` (art: empty → soil only; planted → `PlantArt seed`; watered → `PlantArt watered`; bloomed → `PlantArt bloom` with `flower`).
- Replace: `WeekStrip.tsx` → `WeekCard.tsx`; `MonthCalendar.tsx` rewritten to soil tiles inside a month card with ‹ › (44pt) and legend; delete `DayStateIcon.tsx`.
- Modify: `src/app/(tabs)/garden.tsx` (title "Garden" 44, subtitle "Every day you tended, growing.", WeekCard, month card); `src/app/garden/[date].tsx` (hide stack header; ‹ Garden pill → `router.back()`; day tile; title `format(d, 'EEE, d MMM')`; summary `"2 bloomed · 1 watered · 1 planted"` listing only non-zero parts; section cards with SVG icons, bed tag = bed name on bed color, Ideas = white; empty copy `Nothing happened this day. That's okay.`).
- Test: update `src/features/garden/__tests__/garden.test.tsx`, `gardenScreen.test.tsx`, `src/db/__tests__/repos.test.ts`.

**Interfaces:**
- Consumes: `flowerColors` from Task 1 tokens; `dayState`, `monthGrid`, `weekRange`, `dayKey`.
- Keep testIDs `cell-<key>` / `cell-pad-r-c`; tile art testID `day-<key>-<state>`; keep accessibility labels `"<MMMM d>, <state>"`; future tiles disabled.

- [ ] **Step 1: Failing tests**
  - repos: `range('2026-11-30','2026-12-06')` returns days from both months; a day with two blooms in beds blue (earlier) and pink returns `bloomColor: 'blue'`; deleted plants excluded.
  - MonthCalendar: 42 cells; bloomed day with flower renders `day-<key>-bloomed`; today `selected`; future press ignored; legend shows Nothing / Planted / Watered / Bloomed.
  - WeekCard: renders "5 bloomed · 12 waters" and 7 tiles Mon–Sun; tile press calls `onDayPress(key)` (future disabled).
  - Day detail: title "Wed, 18 Nov" for `2026-11-18`; summary "2 bloomed · 1 watered"; Bloomed section before Watered; bed tag shows bed name; empty day shows the empty copy; "Garden" back button calls `router.back`.
- [ ] **Step 2: Run, verify fail** — `npx jest garden repos`
- [ ] **Step 3: Implement** per `Garden.dc.html` / `GardenDay.dc.html` (tile: white→soil strip bottom, 2px ink border, radius ~12, day number top-left 11 bodySemi; today 3px `colors.leaf` border; future dashed border + 0.45 opacity).
- [ ] **Step 4: Run all tests + tsc** — green.
- [ ] **Step 5: Commit** `feat(garden): soil-tile calendar, week card, day detail cards`
