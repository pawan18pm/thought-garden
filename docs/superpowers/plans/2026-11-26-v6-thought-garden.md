# Thought Garden v6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Expo app's screens to match the approved v6 prototype and rename the app to Thought Garden.

**Architecture:** Keep the SQLite schema, repos and zustand store; add a few store/repo capabilities (auto-bloom, bed colour on create, safe bed removal, range detail) and two pure domain helpers; then replace screen layouts with small focused components that mirror the prototype.

**Tech Stack:** Expo SDK 58, Expo Router, React Native, react-native-svg, expo-sqlite, zustand, jest-expo + @testing-library/react-native, PostHog.

**Spec:** `docs/superpowers/specs/2026-11-26-v6-thought-garden-design.md`. Visual source: board artboard **V6App** ((design board, private)). Implementers must open it and match layout, sizes and copy.

## Global Constraints
- App name everywhere a user sees it: **Thought Garden** (not Mindbed). Keep `slug`/bundle ids unchanged.
- No schema change. No new native dependencies (must run in **Expo Go**). Install anything with `npx expo install`.
- Analytics send actions only, never thought or bed text.
- Screen background `#FFFFFF`; cards: 2px ink (`#1C1B19`) border, radius 22, offset shadow `0 5 0` in the bed's flower colour; titles Bricolage 800 44px; body Inter.
- Touch targets ≥ 44pt; every icon-only button has an `accessibilityLabel`.
- Auto-bloom threshold: **3** waters. "Bloom now" available at ≥ 1 water.
- Max **6** beds, min **1**.
- Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` before every commit; all must pass.

## Review Focus
- A very long thought title must stay on one line with ellipsis and never push the Water/Bloom buttons off-screen (Task 4 test).
- Tapping Water/Plant twice quickly must not double-water or double-plant (Task 2 test: concurrent `water` calls on a 2-water thought bloom it once).
- Removing the **last** bed must be impossible; removing a bed with thoughts must never silently lose them (Task 2 test).
- Onboarding resumed after an interruption must not recreate beds that already exist (Task 6 test, existing behaviour kept).
- A day where one thought was planted, watered and bloomed counts it once, under Bloomed (Task 3 test).

---

### Task 1: Rename and base look

**Files:**
- Modify: `thought-garden/app.json` (`expo.name` → `"Thought Garden"`), `src/app/settings.tsx:102,196`, `src/notifications/reminders.ts:82`, their tests (`settingsScreen.test.tsx:42`, `notifications/__tests__/reminders.test.ts:71`), `docs/tech-stack-roadmap.md` item 6.
- Modify: `src/ui/tokens.ts`
- Create: `src/ui/Logo.tsx`

**Interfaces:**
- Produces: `colors.bg = '#FFFFFF'`, `colors.line = '#EFEDE8'`, `colors.restSoil = '#E3D6C6'`, `colors.restSoilLine = '#C9B8A3'`; `<LogoRow onSettings: () => void />` (sprout mark in a 36×36 `#DDF2D1` rounded square + "Thought Garden" Bricolage 800 19px + gear button 44×44 labelled "Settings").

- [ ] **Step 1:** Update the two existing tests to expect `Thought Garden` (`'Notifications are off for Thought Garden. Turn them on in iOS Settings.'`, notification title `'Thought Garden'`). Add `src/ui/__tests__/Logo.test.tsx`: renders text "Thought Garden"; pressing the element labelled "Settings" calls `onSettings`.
- [ ] **Step 2:** Run `npx jest settingsScreen reminders Logo` → FAIL.
- [ ] **Step 3:** Make the renames, add the tokens and `LogoRow`.
- [ ] **Step 4:** Run the same command → PASS. Run `grep -rn Mindbed src app.json` → no matches.
- [ ] **Step 5:** Commit `chore: rename app to Thought Garden and add v6 base tokens`.

### Task 2: Store rules — auto-bloom, coloured beds, safe bed removal, persona "other"

**Files:**
- Modify: `src/domain/stages.ts`, `src/domain/types.ts`, `src/domain/personas.ts`, `src/db/repos.ts` (`beds.create`), `src/store/garden.ts`
- Test: `src/store/__tests__/garden.test.ts`, `src/domain/__tests__/personas.test.ts`

**Interfaces:**
- Produces: `export const BLOOM_AT_WATERS = 3` (stages.ts); `canBloomNow(p): boolean` = not bloomed and `waterCount >= 1`.
- `Persona` gains `'other'`; `suggestedBeds('other') === []`; `PERSONA_LABELS = { student: 'Studies', jobPrep: 'A new job', professional: 'My work', builder: 'My own ideas', other: 'Something else' }` (no emoji).
- `repos.beds.create(name: string, color?: BedColorKey)`; store `addBed(name: string, color?: BedColorKey): Promise<Bed>`.
- Store `water(id)`: records the water; if the new count `>= BLOOM_AT_WATERS` and not bloomed, blooms it in the same action and tracks `plant_bloomed` with `auto: true`. Guard: a second `water` for the same id while one is in flight is ignored.
- Store `removeBed(id: string, opts?: { moveTo?: string; deleteThoughts?: boolean }): Promise<void>`: refuses (no-op) when it is the last non-Ideas bed; with `moveTo` re-assigns that bed's active plants via `repos.plants.edit(pid, { bedId: moveTo })` first; with `deleteThoughts` calls `repos.plants.remove` on each first.

- [ ] **Step 1: Failing tests** in `garden.test.ts`: `third water auto-blooms` (plant with 2 waters → `water` → `bloomedAt` set, waterCount 3); `concurrent water blooms once` (two parallel `water` calls on a 2-water plant → exactly one bloom, waterCount 3); `removeBed refuses last bed`; `removeBed moveTo keeps thoughts` (plants now in target bed); `removeBed deleteThoughts removes plants`; `addBed with colour stores it`. In `personas.test.ts`: `other has no suggestions` and the new labels.
- [ ] **Step 2:** `npx jest garden.test personas` → FAIL.
- [ ] **Step 3:** Implement the interfaces above.
- [ ] **Step 4:** Same command → PASS; full `npx jest` passes (update any snapshot/label expectations that used the old persona labels).
- [ ] **Step 5:** Commit `feat(store): auto-bloom at 3 waters, safe bed removal, coloured beds`.

### Task 3: Day grouping and range detail

**Files:**
- Create: `src/domain/dayGroups.ts`; Test: `src/domain/__tests__/dayGroups.test.ts`
- Modify: `src/db/repos.ts` (`activity.detailRange`)

**Interfaces:**
- `groupDay(d: { bloomed: Plant[]; watered: Plant[]; planted: Plant[] }): { bloomed: Plant[]; watered: Plant[]; planted: Plant[] }` — each plant id appears once, in the furthest group (bloomed > watered > planted); order within a group preserved.
- `repos.activity.detailRange(startKey: string, endKey: string)` — same shape as `activity.detail` but `BETWEEN` the two day keys. Month summary = `groupDay(detailRange(monthStart, monthEnd))` lengths.

- [ ] **Step 1:** Tests: `plant in all three lists appears only in bloomed`; `watered-and-planted appears only in watered`; `no duplicates within a group`; `empty input → empty groups`.
- [ ] **Step 2:** `npx jest dayGroups` → FAIL. **Step 3:** implement. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(garden): group a day's thoughts by furthest state`.

### Task 4: Thought row

**Files:**
- Create: `src/features/plant/ThoughtRow.tsx`, `src/features/plant/WaterDrops.tsx`; Test: `src/features/plant/__tests__/ThoughtRow.test.tsx`

**Interfaces:**
- `<ThoughtRow plant: Plant; bed: Bed; onWater(): void; onBloom(): void; onPress(): void; highlight?: boolean />` — PlantArt (44px, stage from `stageOf`, flower in bed colour when bloomed), title (17px, 1 line, ellipsis), `<WaterDrops count={min(waterCount, 3)} />` (3 drop SVGs 14×17, filled `#7FA8E8` up to count, `accessibilityLabel="N of 3 waters"`), **Water** button (drop icon + "Water", label "Water {title}"), flower icon button (44×44, label "Bloom {title} now", shown only when `canBloomNow`). Bloomed: no buttons, pink "Bloomed" pill instead of drops.

- [ ] **Step 1:** Tests: seed shows Water but no bloom button; 1 water shows both; drops label "2 of 3 waters"; bloomed shows "Bloomed" and no buttons; pressing each calls its handler; a 200-character title renders with `numberOfLines={1}`.
- [ ] **Step 2:** FAIL → **Step 3:** implement → **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(plant): minimal thought row with drops and bloom button`.

### Task 5: Plant tab

**Files:**
- Create: `src/features/plant/QuickPlantBox.tsx`, `src/features/plant/BedSection.tsx`, `src/features/plant/RemoveBedPrompt.tsx`
- Modify: `src/app/(tabs)/plant.tsx` (replace FAB, PlantingSheet, PlantHeader and BloomedTodayCard usage with the v6 layout; keep `PlantDetailSheet` on row press)
- Test: `src/features/plant/__tests__/PlantTab.test.tsx` (replaces tests of removed components; delete `BloomedTodayCard.test.tsx`/`PlantingSheet.test.tsx` only if their components are deleted)

**Interfaces:**
- `<QuickPlantBox beds: Bed[]; onPlant(text: string, bedId: string): Promise<void> />` — input placeholder "What's on your mind?", bed chips (selected = bed tint), Plant button disabled/grey when trimmed text empty, Enter submits, after success clears input and shows "Planted in {bed}" (green) else "Into {bed}".
- `<BedSection bed; plants; editing: boolean; onRename; onRecolor; onRemove; onPickForPlanting; row handlers />` — bed card (tint circle with flower, name, "{n} growing"), empty state button "Empty soil · plant a thought here" (selects that bed in the box), rows via `ThoughtRow`; in edit mode name becomes a TextInput and a ✕ remove button appears.
- `<RemoveBedPrompt bedName; count; moveToName; onMove; onDelete; onCancel />` — copy: "{bed} has {n} thought(s). What should happen to them?", buttons "Move them to {other}, remove bed", "Delete bed and its thoughts", "Cancel".
- Screen: `LogoRow` (gear → `router.push('/settings')`), "Plant" title + "{growing} growing · {bloomedToday} bloomed", QuickPlantBox, "Your beds" + "Edit beds"/"Done" toggle, sections ordered by `orderBeds`; the Ideas bed is hidden when it has no active plants; "+ Add a bed" (dashed) in edit mode while < 6 beds.

- [ ] **Step 1:** Tests (mock store like existing plant tests): typing + Plant calls `plant(text, selectedBedId, null, 'fab')` and shows "Planted in X"; Plant disabled when empty; chip selection changes target; empty Ideas bed not rendered; Edit beds shows rename inputs; ✕ on a bed with thoughts shows the prompt and "Move" calls `removeBed(id, { moveTo })`; ✕ on an empty bed calls `removeBed(id)` directly.
- [ ] **Step 2:** FAIL → **Step 3:** implement → **Step 4:** PASS; `npx jest` all green.
- [ ] **Step 5:** Commit `feat(plant): v6 plant tab with quick-plant box and editable beds`.

### Task 6: Onboarding v6

**Files:**
- Modify: `src/features/onboarding/OnboardingScreen.tsx` (progress bar, white bg, back button), `src/features/onboarding/useOnboardingDraft.ts`, `src/app/onboarding/welcome.tsx`, `persona.tsx`, `beds.tsx`, `first-plant.tsx`, `reminder.tsx`
- Test: `src/features/onboarding/__tests__/onboarding.test.tsx`

**Interfaces:**
- `DraftBed` gains `color: BedColorKey`; draft actions: `recolor(key)`, `remove(key)`, `addNamed(name: string): boolean` (false when blank or 6 beds), `clear()`. Remove `toggle`/selected (every draft bed is kept); `setPersona('other')` yields `[]`.
- Copy (exact): welcome title "hey, welcome to Thought Garden." + the three paragraphs and button "let's grow" from V6App; persona title "What are you growing right now?" with 5 cards (label + sub from V6App); beds title "Make your beds", intro differs for `other` ("Start with one bed for each kind of thought. Name them your way.") vs suggested ("We suggested these for you. Rename, recolor, remove or add your own."), add field placeholder "Name your first bed…" / "Name another bed…", idea chips `['Health','Reading','Work','Side project','Money','Learning','Family']` minus existing (max 5 shown), "Clear all and start blank", Skip (keeps current draft; if empty uses one bed "My thoughts"), button "Continue with N bed(s)" disabled as "Add at least one bed"; first-plant title "Plant your first thought", banner card in chosen bed tint with empty multiline input placeholder "Type a thought you want to grow…", chips = created beds, button "Plant it in {bed}" disabled until text; reminder title "Want a daily nudge to water it?", "Planted in {bed}" + quoted thought, choices Morning 8:00 / Evening 9:00, "Yes, nudge me", "Not now".
- Beds are created (with colours) on Continue/Skip exactly as today, including the resume guard.

- [ ] **Step 1:** Update/extend tests: `other` persona starts with no beds and Continue disabled; adding via field and idea chip; Skip with no beds creates "My thoughts"; created beds pass their colour to `addBed`; first-plant chips list only created beds and Plant is disabled until typed; resume guard test still passes.
- [ ] **Step 2:** FAIL → **Step 3:** implement → **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(onboarding): v6 minimal onboarding with custom beds`.

### Task 7: Garden tab

**Files:**
- Create: `src/features/garden/NextUpCard.tsx`, `src/features/garden/MonthCard.tsx`, `src/features/garden/DayDropdown.tsx`
- Modify: `src/features/garden/SoilTile.tsx`, `src/features/garden/MonthCalendar.tsx`, `src/features/garden/useActivity.ts` (add month summary via Task 3), `src/app/(tabs)/garden.tsx` (drop WeekCard and navigation to `/garden/[date]`)
- Delete: `src/app/garden/[date].tsx`, `src/features/garden/WeekCard.tsx` and their tests if nothing else uses them.
- Test: `src/features/garden/__tests__/gardenScreen.test.tsx`, `garden.test.tsx`

**Interfaces:**
- `<NextUpCard thirsty: number; ready: number; onPress() />` — title "Next up: {n} thought(s) is/are thirsty" (thirsty = active, waterCount < 2), else "Next up: {n} ready to bloom", else "Next up: plant a new thought"; sub "Go to the Plant tab".
- `<MonthCard summary: {bloomed; watered; planted}; daysTended: number; …calendar props />` — chips "{n} bloomed / watered / planted", line: bloomed>0 → "Your garden is blooming.", tended>0 → "Nice start.", else "Your garden starts today. Plant something."; followed by " {d} day(s) tended this month." when d>0.
- `SoilTile` states per V6App: active day = white, ink border, soil strip `colors.soil`, plant art 30px (seed / sprout / growing / flower in earliest bloom's bed colour) + yellow sparkle on bloom days and pink offset shadow; rest day = `colors.paper` bg, `restSoil` strip and border; future = dashed `#D8D3CA`, not pressable; today = 3px `colors.leaf` border; selected = `#F3F9EE` bg + ink offset shadow; date number top-left 10px.
- `<DayDropdown dateKey; groups (from groupDay of activity.detail); beds; onClose />` — title "Today · Thursday, 26 November" / "Thursday, 26 November", three count tiles equal to group lengths, sections "Bloomed (n)", "Watered (n)", "Planted (n)" (only non-empty) each listing PlantArt + title + bed tag; quiet day text "Nothing happened this day. That's okay."; tapping a tile toggles it open/closed; today open by default.

- [ ] **Step 1:** Tests: tapping a past day shows its dropdown with grouped sections and matching counts; tapping again closes; future tiles not pressable; month chips show grouped (not double-counted) numbers; NextUpCard copy for thirsty/ready/none.
- [ ] **Step 2:** FAIL → **Step 3:** implement → **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(garden): soil-tile calendar, day dropdown and next-up card`.

### Task 8: Settings restyle

**Files:**
- Modify: `src/app/settings.tsx`, `src/features/settings/ManageBeds.tsx`; Test: `settingsScreen.test.tsx`, `ManageBeds.test.tsx`

**Interfaces:**
- Layout per V6App: "‹ Back" pill, "Settings" title, Manage beds card (green offset shadow, "{n} of 6", rows: ↑ move up, colour dot (tap = next colour), name input, "{n} thoughts"), Daily reminder card (switch + Morning 8:00 / Evening 9:00 / existing custom time), list rows Who are you (shows persona label) / Privacy / About & feedback (version), Reset all data with confirm ("Keep my garden" / "Reset"). Keep every existing behaviour (permissions note, analytics toggle if present).

- [ ] **Step 1:** Update tests to the new copy; add: colour dot press calls `recolorBed` with the next colour; Reset asks to confirm before wiping.
- [ ] **Step 2:** FAIL → **Step 3:** implement → **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(settings): v6 settings layout`.

### Task 9: Verify on device and record

**Files:** Modify: `docs/build-notes.md` (v6 rulings + builder's calls from the spec).

- [ ] **Step 1:** `npx tsc --noEmit && npx expo lint && npx jest` → all pass.
- [ ] **Step 2:** `npx expo start --lan --port 8082`; on iPhone Expo Go run the flow: fresh install → Something else → add 2 beds → first thought → Not now → plant 2 thoughts → Water ×3 (auto-bloom) → Bloom now on another → Garden today tile shows flower, dropdown groups correctly → Settings rename a bed → Plant tab shows new name.
- [ ] **Step 3:** Commit `docs: v6 build notes`.
