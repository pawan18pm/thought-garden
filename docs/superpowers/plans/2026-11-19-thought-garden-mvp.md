# Mindbed MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Mindbed iOS MVP (onboarding, Plant tab, Garden tab, daily reminder, Settings) as an Expo app the owner runs in Expo Go on their iPhone.

**Architecture:** Expo Router screens stay thin. All product rules are pure functions in `src/domain` (test-first). Data lives in on-device SQLite behind a small `Db` interface, so repositories are tested in Node with `node:sqlite`. A zustand store calls the repositories and feeds the UI. Visuals are hand-built components from the style board.

**Tech Stack:** Expo SDK (latest stable), TypeScript, expo-router, expo-sqlite, zustand, react-native-svg, react-native-reanimated, react-native-gesture-handler, react-native-draggable-flatlist, expo-notifications, expo-crypto, expo-sharing, expo-file-system, @expo-google-fonts/bricolage-grotesque, @expo-google-fonts/inter, date-fns, posthog-react-native, jest-expo, @testing-library/react-native.

**Spec:** `docs/superpowers/specs/2026-11-19-thought-garden-design.md` (product: `docs/srd.md`; visuals: style board (design board, private))

## Global Constraints

- App lives in `thought-garden/` at the workspace root; all paths below are relative to it unless they start with `docs/`.
- Must run in **Expo Go on iOS**. Use only libraries bundled with Expo Go; no custom native modules; no dev build until milestone 7 (out of scope here).
- No accounts or backend. The **only** network traffic is anonymous PostHog events through `track()` (spec §9). Event properties are numbers, booleans and fixed enums: never thought text or bed names.
- "Day" = the device's local calendar day. Timestamps are stored as `formatISO(new Date())` (local offset), and a day key is `yyyy-MM-dd` = the first 10 characters of a stored timestamp.
- Thought text: trimmed, 1–140 characters.
- Priority: 3 = High (▲▲), 2 = Medium (▲), 1 = Low (–), `null` = none; `null` sorts as Low.
- Colors: paper #FBF7EF, ink #1C1B19, muted #5E5A52, soil #B8875A, seed #7A5230, leaf #3F9142, leafLight #7CC47F; bed colors in order: blue #D6E6FF, orange #FFE0C7, purple #E8DDFF, yellow #FFF1B8, green #DDF2D1, pink #FFD9E4; Ideas bed uses #FFFFFF.
- Type: Bricolage Grotesque 800 (titles, 44), 700 (bed names, 20); Inter 400/600 (body 16, labels 13, greeting 14 muted).
- Shape: card radius 22; 2px ink border; offset shadow 4×4 (ink; leaf on the primary action). Touch targets ≥ 44pt.
- Copy tone: never guilt-inducing. No streaks, no "you missed".
- Respect iOS Reduce Motion: skip grow/bloom/slide animations when it's on.
- Commit after every task (`git` repo at the workspace root).

## Review Focus

1. **Whitespace-only or 141+ character thought:** the Plant it button stays disabled and nothing is saved. Test in Task 2 (`validateThought`) and Task 8 (sheet).
2. **Activity just before and after local midnight:** a watering at 23:59 counts for that day, one at 00:00 for the next. Test in Task 5 (`dayActivity`).
3. **Deleting a bed that has plants:** the plants move to Ideas, and no plant is orphaned or lost. Test in Task 5 (`beds.remove`).
4. **Notification permission denied:** the reminder is saved as off, the app doesn't crash, and Settings shows how to enable it. Test in Task 11 (`enableReminder`).
5. **Double-tapping Plant it:** only one plant is created. Test in Task 8 (sheet).

---

### Task 1: Project scaffold, tooling, tokens

**Files:**
- Create: `thought-garden/` (via create-expo-app), `.gitignore` at workspace root
- Create: `src/ui/tokens.ts`
- Modify: `package.json` (jest config), `app/_layout.tsx`
- Test: `src/ui/__tests__/tokens.test.ts`

**Interfaces:**
- Produces: `colors` (keys: `paper, ink, muted, soil, seed, leaf, leafLight, ideasBed`), `bedColors: Record<BedColorKey, string>`, `BED_COLOR_ORDER: BedColorKey[]`, `type BedColorKey = 'blue'|'orange'|'purple'|'yellow'|'green'|'pink'`, `radius.card = 22`, `border = 2`, `shadowOffset = 4`, `fonts` (`titleXBold`, `titleBold`, `body`, `bodySemi`).

- [ ] **Step 1:** At workspace root: `git init`; create `.gitignore` containing `thought-garden/node_modules/`, `thought-garden/.expo/`, `thought-garden/.env`, `*.log`.
- [ ] **Step 2:** `npx create-expo-app@latest thought-garden --template default`, then in `thought-garden/`: `npm run reset-project` (answer "n" to keeping examples) so `app/` holds only a blank `index.tsx` and `_layout.tsx`.
- [ ] **Step 3:** Install: `npx expo install expo-sqlite react-native-svg react-native-reanimated react-native-gesture-handler expo-notifications expo-crypto expo-sharing expo-file-system expo-font @expo-google-fonts/bricolage-grotesque @expo-google-fonts/inter posthog-react-native expo-application expo-device expo-localization` then `npm i zustand date-fns react-native-draggable-flatlist` and `npm i -D jest-expo jest @testing-library/react-native @types/jest`. Add to `package.json`: `"jest": { "preset": "jest-expo" }` and script `"test": "jest"`.
- [ ] **Step 4: Write the failing test** `tokens.test.ts`: `expect(bedColors.blue).toBe('#D6E6FF')`, `expect(BED_COLOR_ORDER).toEqual(['blue','orange','purple','yellow','green','pink'])`, `expect(colors.paper).toBe('#FBF7EF')`, `expect(radius.card).toBe(22)`.
- [ ] **Step 5:** Run `npx jest src/ui` → FAIL (module not found).
- [ ] **Step 6:** Implement `src/ui/tokens.ts` with the Global Constraints values.
- [ ] **Step 7:** Run `npx jest src/ui` → PASS.
- [ ] **Step 8:** In `app/_layout.tsx` load fonts with `useFonts` (BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold, Inter_400Regular, Inter_600SemiBold) and wrap in `GestureHandlerRootView`; `app/index.tsx` shows "Mindbed" in the title font on paper background.
- [ ] **Step 9:** Run `npx expo start`, scan the QR with the iPhone camera → app opens in Expo Go showing the title in Bricolage on cream. (Owner checks.)
- [ ] **Step 10: Commit** `git add -A && git commit -m "chore: scaffold Expo app with tokens and fonts"`

### Task 2: Domain types, stages, ordering, validation

**Files:**
- Create: `src/domain/types.ts`, `src/domain/stages.ts`, `src/domain/ordering.ts`, `src/domain/validate.ts`
- Test: `src/domain/__tests__/stages.test.ts`, `ordering.test.ts`, `validate.test.ts`

**Interfaces:**
- Produces (`types.ts`):
  - `type Priority = 1 | 2 | 3 | null`
  - `type Stage = 'seed' | 'watered' | 'growing' | 'bloom'`
  - `type Persona = 'student' | 'jobPrep' | 'professional' | 'builder'`
  - `interface Bed { id: string; name: string; color: BedColorKey | 'ideas'; position: number; isIdeas: boolean; folded: boolean; createdAt: string }`
  - `interface Plant { id: string; bedId: string; text: string; priority: Priority; createdAt: string; bloomedAt: string | null; waterCount: number }`
- Produces: `stageOf(p: Pick<Plant,'waterCount'|'bloomedAt'>): Stage`; `sortPlants(plants: Plant[]): Plant[]` (new array); `validateThought(raw: string): string | null` (trimmed text, or null if invalid).

- [ ] **Step 1: Write failing tests.**
  - stages: `{waterCount:0,bloomedAt:null}`→`'seed'`; 1→`'watered'`; 2 and 7→`'growing'`; `{waterCount:0,bloomedAt:'2026-11-19T10:00:00+05:30'}`→`'bloom'`.
  - ordering: input priorities `[null,3,1,2,3]` with distinct createdAt → order is both 3s (newer first), then 2, then `1` and `null` by createdAt desc (null equals Low).
  - validate: `'  hi  '`→`'hi'`; `''`→null; `'   \n '`→null; 140 × `'a'`→same string; 141 × `'a'`→null.
- [ ] **Step 2:** `npx jest src/domain` → FAIL.
- [ ] **Step 3:** Implement the three modules per the signatures.
- [ ] **Step 4:** `npx jest src/domain` → PASS.
- [ ] **Step 5: Commit** `feat(domain): types, stages, ordering, validation`

### Task 3: Domain: day state, week, greeting

**Files:**
- Create: `src/domain/dayState.ts`, `src/domain/greeting.ts`, `src/domain/dates.ts`
- Test: `src/domain/__tests__/dayState.test.ts`, `greeting.test.ts`, `dates.test.ts`

**Interfaces:**
- Produces: `type DayState = 'empty'|'planted'|'watered'|'bloomed'`; `interface DayActivity { planted: number; watered: number; bloomed: number }`; `dayState(a: DayActivity): DayState`; `greetingFor(hour: number): string`; `dayKey(d: Date): string` (`yyyy-MM-dd` local); `nowIso(): string` (`formatISO(new Date())`); `weekRange(now: Date): { startKey: string; endKey: string }` (Monday to Sunday); `monthGrid(year: number, month0: number): (string | null)[]` (42 cells, Monday-first, null for padding).

- [ ] **Step 1: Write failing tests.**
  - dayState: `{0,0,0}`→empty; `{2,0,0}`→planted; `{1,3,0}`→watered; `{0,0,1}`→bloomed; `{0,5,1}`→bloomed.
  - greeting: 5→`'Good morning'`, 11→morning, 12→`'Good afternoon'`, 16→afternoon, 17→`'Good evening'`, 20→evening, 21→`'Good night'`, 0 and 4→night.
  - dates: `weekRange(new Date(2026,10,19))` (Thursday) → `{startKey:'2026-11-16', endKey:'2026-11-22'}`; `weekRange(new Date(2026,10,22))` (Sunday) → same week; `monthGrid(2026,10)` has length 42, `[6]==='2026-11-01'` (Nov 1 2026 is a Sunday), `[0]===null`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement with date-fns (`startOfWeek(…, {weekStartsOn:1})`, `format`). **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** `feat(domain): day state, greeting, date helpers`

### Task 4: Domain: personas, bed colors, reminder dates

**Files:**
- Create: `src/domain/personas.ts`, `src/domain/bedColors.ts`, `src/domain/reminder.ts`
- Test: `src/domain/__tests__/personas.test.ts`, `bedColors.test.ts`, `reminder.test.ts`

**Interfaces:**
- Produces: `suggestedBeds(p: Persona): string[]`; `PERSONA_LABELS: Record<Persona, string>`; `nextBedColor(used: BedColorKey[]): BedColorKey`; `reminderDates(now: Date, time: string, days?: number): Date[]` (default 14); `REMINDER_LINES: string[]`; `reminderLine(index: number): string` (cycles).

- [ ] **Step 1: Write failing tests.**
  - personas: student → `['Subjects','Exams','Assignments','Skills']`; jobPrep → `['Interview','DSA','Resume','Portfolio']`; professional → `['Work','Upskilling','Side project']`; builder → `['Ideas to explore','Build','Learn','Launch']`. Labels: `'🎓 Student'`, `'💼 Preparing for a job'`, `'🧑‍💻 Working professional'`, `'💡 Builder / has ideas'`.
  - bedColors: `[]`→blue; `['blue']`→orange; all six used→blue (cycle by count); `['blue','purple']`→orange (first unused).
  - reminder: `reminderDates(new Date(2026,10,19,8,0), '21:00')` → 14 dates, first is Nov 20 21:00 local, last Dec 3 21:00, never Nov 19. Also with now at 22:00 → still starts Nov 20.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. `REMINDER_LINES` exactly: `"Your garden's waiting. Anything to water today? 🌙"`, `"A quick look at your garden? Even one drop counts 💧"`, `"Got a thought on your mind? Plant it before it slips away 🌱"`. **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** `feat(domain): personas, bed colors, reminder dates`

### Task 5: Database and repositories

**Files:**
- Create: `src/db/Db.ts`, `src/db/schema.ts`, `src/db/expoDb.ts`, `src/db/repos.ts`
- Create (test only): `src/db/__tests__/nodeDb.ts`
- Test: `src/db/__tests__/repos.test.ts` (first line `/** @jest-environment node */`)

**Interfaces:**
- Consumes: types (Task 2), `dayKey`, `nowIso`, `DayActivity` (Task 3), `nextBedColor` (Task 4).
- Produces:
  - `interface Db { exec(sql: string): Promise<void>; run(sql: string, params?: unknown[]): Promise<void>; all<T>(sql: string, params?: unknown[]): Promise<T[]>; first<T>(sql: string, params?: unknown[]): Promise<T | null> }`
  - `migrate(db: Db): Promise<void>` (idempotent; creates tables from spec §5 plus indexes on `plants(bed_id)`, `waterings(plant_id)`)
  - `openExpoDb(): Promise<Db>` (wraps `expo-sqlite` `openDatabaseAsync('garden.db')`)
  - `createRepos(db: Db, newId: () => string, now: () => string)` returning:
    - `beds: { list(): Promise<Bed[]>; create(name: string): Promise<Bed>; ensureIdeas(): Promise<Bed>; rename(id, name); setColor(id, color); setFolded(id, folded: boolean); reorder(ids: string[]); remove(id): Promise<void> }`
    - `plants: { listActive(): Promise<Plant[]>; create(input: { text: string; bedId: string; priority: Priority }): Promise<Plant>; water(id): Promise<void>; bloom(id): Promise<void>; unbloom(id): Promise<void>; edit(id, patch: Partial<Pick<Plant,'text'|'priority'|'bedId'>>): Promise<void>; remove(id): Promise<void>; bloomedOn(dayKey: string): Promise<Plant[]> }`
    - `activity: { day(dayKey): Promise<DayActivity>; month(year, month0): Promise<Record<string, DayActivity>>; week(startKey, endKey): Promise<{ blooms: number; waters: number }>; detail(dayKey): Promise<{ bloomed: Plant[]; watered: Plant[]; planted: Plant[] }> }`
    - `settings: { get(key: string): Promise<string | null>; set(key: string, value: string): Promise<void> }`

- [ ] **Step 1:** Write `nodeDb.ts`: implements `Db` over `new DatabaseSync(':memory:')` from `node:sqlite`. (If jest can't resolve `node:sqlite`, add `testEnvironment: 'node'` for this folder via the docblock; Node ≥ 22.5 is required and the machine has v26.)
- [ ] **Step 2: Write failing tests** using `createRepos(nodeDb, counterId, fixedClock)`:
  - `listActive` excludes bloomed and deleted plants and includes `waterCount`.
  - `water` twice → `waterCount === 2`.
  - `bloom` sets `bloomedAt`; `unbloom` clears it.
  - `ensureIdeas` called twice → one Ideas bed, `isIdeas: true`, `color: 'ideas'`.
  - `beds.list` returns user beds by `position`, then Ideas last.
  - `beds.create` assigns colors blue, orange, … in order.
  - **Review Focus 3:** create bed B with 2 plants, `beds.remove(B)` → both plants now have the Ideas bed's id; B gone.
  - `plants.remove` hides the plant from `listActive`, `activity.day`, and `activity.detail` (spec §5).
  - **Review Focus 2:** watering at `2026-11-19T23:59:00+05:30` → `day('2026-11-19').watered === 1`; watering at `2026-11-20T00:00:00+05:30` → counted for `'2026-11-20'`.
  - `activity.week('2026-11-16','2026-11-22')` counts blooms and waterings in range only.
- [ ] **Step 3:** Run `npx jest src/db` → FAIL.
- [ ] **Step 4:** Implement `schema.ts` (`migrate`), `repos.ts`, `expoDb.ts`. Day matching: `substr(ts,1,10) = ?`. All plant queries filter `deleted_at IS NULL`.
- [ ] **Step 5:** Run `npx jest src/db` → PASS.
- [ ] **Step 6: Commit** `feat(db): sqlite schema and repositories`

### Task 6: Analytics wrapper and app store

**Files:**
- Create: `src/analytics/events.ts`, `src/analytics/analytics.ts`, `src/store/garden.ts`, `src/store/AppProvider.tsx`
- Modify: `app/_layout.tsx` (open DB, migrate, `ensureIdeas`, `initAnalytics()`, provide store; splash until ready)
- Test: `src/analytics/__tests__/analytics.test.ts`, `src/store/__tests__/garden.test.ts` (`@jest-environment node`, uses `nodeDb`)

**Interfaces:**
- Produces (`events.ts`): `type EventMap` with exactly the events and property types in spec §9 (properties: `number | boolean` or string-literal unions like `'fab'|'bed_plus'|'onboarding'`, never plain `string`).
- Produces (`analytics.ts`): `initAnalytics(): void` (creates a PostHog client from `process.env.EXPO_PUBLIC_POSTHOG_KEY` with host `https://us.i.posthog.com`; no key → no-op client); `track<K extends keyof EventMap>(name: K, props: EventMap[K]): void`; `setAnalyticsEnabled(on: boolean): void` (optIn/optOut, persisted in settings key `analytics_enabled`); `__setClientForTests(client)`.
- Consumes: `createRepos` (Task 5), `sortPlants`, `validateThought` (Task 2).
- Produces: `createGardenStore(repos)` → zustand store with state `{ beds: Bed[]; plants: Plant[]; bloomedToday: Plant[]; lastBedId: string | null; ready: boolean }` and actions `load(): Promise<void>`, `plant(text: string, bedId?: string, priority?: Priority): Promise<Plant | null>` (returns null when `validateThought` fails; default bed = `bedId ?? lastBedId ?? ideasId`; tracks `plant_created`), `water(id)` (tracks `plant_watered`), `bloom(id)` (tracks `plant_bloomed`), `unbloom(id)` (tracks `bloom_undone`), `edit(id, patch)`, `remove(id)`, `addBed(name)`, `renameBed`, `recolorBed`, `toggleFold(id)`, `reorderBeds(ids)`, `removeBed(id)`; selector `plantsInBed(bedId): Plant[]` (already `sortPlants`-ordered). Hook `useGarden` exported from `AppProvider.tsx`.

- [ ] **Step 0: Analytics tests first** (`analytics.test.ts`, fake client via `__setClientForTests`): `track('plant_watered', { water_count: 2 })` calls `capture('plant_watered', { water_count: 2 })`; with no key `initAnalytics()` + `track(...)` doesn't throw; `setAnalyticsEnabled(false)` calls `optOut`. Then a store test: after `plant('Secret thought', bedA)`, no captured payload contains `'Secret thought'` or bedA's name (`JSON.stringify` of all captures). Run → FAIL, implement `events.ts` + `analytics.ts`, run → PASS.
- [ ] **Step 1: Write failing tests:** `plant('   ')` → null and no row; `plant('Learn SQL')` with no bed → lands in Ideas; after `plant('x', bedA)`, `plant('y')` lands in bedA (lastBedId); `bloom` moves the plant from `plants` to `bloomedToday`; `unbloom` moves it back; `removeBed` re-homes plants into Ideas in state.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS.
- [ ] **Step 5:** Owner creates a free PostHog Cloud project and puts its project API key in `thought-garden/.env` as `EXPO_PUBLIC_POSTHOG_KEY=...` (git-ignored; skipping this just disables analytics). `npx expo start` → app still opens in Expo Go (no crash on DB init); with a key set, an `app_opened` event appears in PostHog › Activity.
- [ ] **Step 6: Commit** `feat(store): analytics wrapper and garden store`

### Task 7: Visual components

**Files:**
- Create: `src/ui/PlantArt.tsx`, `src/ui/PlantStake.tsx`, `src/ui/BedCard.tsx`, `src/ui/PillTabBar.tsx`, `src/ui/PlantItButton.tsx`, `src/ui/ChunkyButton.tsx`, `src/ui/Sheet.tsx`, `src/ui/useReducedMotion.ts`
- Test: `src/ui/__tests__/components.test.tsx`

**Interfaces:**
- Produces: `<PlantArt stage: Stage; size?: number; flowerColor?: string />` (SVG paths copied from the style board's "Design system" artboard); `<PlantStake text: string; priority: Priority />` (▲▲ / ▲ / nothing prefix, 2-line clamp); `<BedCard bed: Bed; plants: Plant[]; onPlantPress(id); onAddPress(); onToggleFold() />` (header name + "n plants", horizontal ScrollView, soil strip; folded = header only; empty = "Empty soil · plant your first thought here"); `<PillTabBar />` (custom `tabBar` for expo-router Tabs: Plant | Garden); `<PlantItButton onPress />` (SVG ring text "PLANT IT · PLANT IT · PLANT IT ·", rotates slowly unless reduced motion, accessibilityLabel "Plant a thought"); `<ChunkyButton label; onPress; tone?: 'default'|'primary'; disabled? />`; `<Sheet visible; onClose; children />` (bottom sheet via `Modal` + Reanimated slide; `KeyboardAvoidingView`); `useReducedMotion(): boolean` (wraps `AccessibilityInfo.isReduceMotionEnabled` + listener).

- [ ] **Step 1: Write failing tests:** PlantStake with priority 3 shows text starting `▲▲`, with 2 `▲ `, with null no triangle; BedCard with 0 plants shows the empty-soil copy; BedCard with `folded: true` doesn't render plant stakes; BedCard header shows `3 plants` for three plants and `1 plant` for one; PlantItButton has accessibilityLabel `Plant a thought`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement to the style board. **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** `feat(ui): garden visual components`

### Task 8: Plant tab, planting sheet, plant detail (Milestone 2: first prototype)

**Files:**
- Create: `app/(tabs)/_layout.tsx`, `app/(tabs)/plant.tsx`, `app/(tabs)/garden.tsx` (placeholder "Garden coming soon"), `src/features/plant/PlantingSheet.tsx`, `src/features/plant/PlantDetailSheet.tsx`, `src/features/plant/BloomedTodayRow.tsx`
- Modify: `app/index.tsx` → redirect to `/(tabs)/plant`
- Test: `src/features/plant/__tests__/PlantingSheet.test.tsx`, `PlantDetailSheet.test.tsx`

**Interfaces:**
- Consumes: `useGarden` (Task 6); components (Task 7); `greetingFor`, `validateThought`.
- Produces: `<PlantingSheet visible; initialBedId?: string; onClose />`, `<PlantDetailSheet plantId: string | null; onClose />`.

- [ ] **Step 1: Write failing tests (PlantingSheet, store mocked):**
  - The text input is focused on open (`autoFocus`).
  - **Review Focus 1:** with `'   '` the Plant it button is disabled; with 141 chars it's disabled.
  - Submitting `'Learn SQL'` with no chips calls `plant('Learn SQL', undefined, null)` once.
  - **Review Focus 5:** pressing Plant it twice quickly calls `plant` once (button disabled while saving).
  - Selecting the ▲▲ chip and a bed chip passes `3` and that bed's id.
- [ ] **Step 2: Write failing tests (PlantDetailSheet):** shows `watered 2 times` for waterCount 2; Water press calls `water(id)`; Bloom press calls `bloom(id)`; Delete asks for confirmation before `remove(id)`; editing the text to `'New text'` and saving calls `edit(id, { text: 'New text' })`; editing to whitespace doesn't save; Change priority and Move bed call `edit` with `{ priority }` / `{ bedId }`.
- [ ] **Step 3:** Run → FAIL. **Step 4:** Implement the sheets, then `plant.tsx`: Settings button (top right, links to `/settings`), greeting line `"{greeting} · {n} plants growing"`, "Plant" title, `FlatList` of `BedCard`s (Ideas last), `BloomedTodayRow` (tap a bloom → Undo bloom), floating `PlantItButton`. A bed's "+" opens the sheet with that bed preselected. After planting, the target bed unfolds. Water triggers a grow animation; Bloom triggers a bloom pop before the plant leaves the bed (skipped under reduced motion). **Step 5:** Run → PASS.
- [ ] **Step 6: Owner review on iPhone:** plant 5 thoughts across 2 beds (with and without priority); confirm ordering ▲▲ → ▲ → none; water one twice (art grows); bloom one (appears under Bloomed today; Undo works); kill and reopen the app → data persists.
- [ ] **Step 7: Commit** `feat(plant): plant tab with planting and detail sheets`

### Task 9: Onboarding

**Files:**
- Create: `app/onboarding/_layout.tsx`, `welcome.tsx`, `persona.tsx`, `beds.tsx`, `first-plant.tsx`, `reminder.tsx`; `src/features/onboarding/useOnboardingDraft.ts`
- Modify: `app/_layout.tsx` (if `settings.onboarding_done !== '1'` redirect to `/onboarding/welcome`)
- Test: `src/features/onboarding/__tests__/onboarding.test.tsx`

**Interfaces:**
- Consumes: `suggestedBeds`, `PERSONA_LABELS` (Task 4); store `addBed`, `plant`, `water` (Task 6); `enableReminder` (Task 11; until then the Reminder screen's "Yes" just stores the time).
- Produces: settings keys `persona`, `onboarding_done = '1'`; tracks `onboarding_step_viewed {step}` on each screen and `onboarding_completed {persona, beds_count}`.

- [ ] **Step 1: Write failing tests:** picking jobPrep shows chips Interview, DSA, Resume, Portfolio; Continue is disabled with 0 beds selected and with 7; a renamed chip ("Interview" → "Interviews") is created with the new name; the first-plant screen preselects the first kept persona bed (not Ideas); submitting the first plant creates it with `waterCount === 1` (auto-water, spec §7); "Not now" on Reminder sets `onboarding_done` and navigates to `/(tabs)/plant`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement screens (Welcome copy: "Every thought is a seed." / "Plant it, water it, watch it bloom." / button "Start growing"; Persona title "What describes you best?"; Beds title "What are you growing right now?"; First plant title "Let's plant your first thought"; Reminder title "Want a gentle nudge?" with options "Morning 8:00", "Evening 9:00", "Pick a time", buttons "Yes, remind me" / "Not now"). **Step 4:** Run → PASS.
- [ ] **Step 5: Owner review:** delete the app's data (reinstall Expo Go project or clear via Settings dev row), run onboarding end to end on the iPhone.
- [ ] **Step 6: Commit** `feat(onboarding): persona, beds, first plant, reminder choice`

### Task 10: Garden tab and day detail

**Files:**
- Modify: `app/(tabs)/garden.tsx`
- Create: `app/garden/[date].tsx`, `src/features/garden/MonthCalendar.tsx`, `src/features/garden/WeekStrip.tsx`, `src/features/garden/DayStateIcon.tsx`
- Test: `src/features/garden/__tests__/garden.test.tsx`

**Interfaces:**
- Consumes: `repos.activity.month/week/detail` (Task 5) through the store or a `useActivity` hook in this task; `dayState`, `monthGrid`, `weekRange` (Task 3).
- Produces: `<MonthCalendar year; month0; states: Record<string, DayState>; todayKey; onDayPress(key) />`, `<WeekStrip blooms: number; waters: number />` (text `"🌸 {blooms} bloomed · 💧 {waters} waters this week"`).

- [ ] **Step 1: Write failing tests:** MonthCalendar renders 42 cells and marks `todayKey` with accessibilityState selected; a day with state `bloomed` shows the bloom icon (by testID `day-2026-11-18-bloomed`); WeekStrip renders `🌸 12 bloomed · 💧 20 waters this week`; the day detail screen lists sections Bloomed / Watered / Planted and hides empty sections.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement (previous/next month arrows; refresh on tab focus). **Step 4:** Run → PASS.
- [ ] **Step 5: Owner review:** today's cell reflects plant/water/bloom actions after switching tabs; tapping a day opens its detail.
- [ ] **Step 6: Commit** `feat(garden): month calendar, week strip, day detail`

### Task 11: Daily reminder, Settings, analytics toggle

**Files:**
- Create: `src/notifications/reminders.ts`, `app/settings.tsx`, `src/features/settings/ManageBeds.tsx`
- Modify: `app/_layout.tsx` (on `AppState` → active: set `last_opened_date`, track `app_opened`, call `rescheduleReminders`; on notification response track `reminder_opened`), `app/onboarding/reminder.tsx` (call `enableReminder`)
- Test: `src/notifications/__tests__/reminders.test.ts` (mocks `expo-notifications`)

**Interfaces:**
- Consumes: `reminderDates`, `reminderLine` (Task 4); `repos.settings` (Task 5); `track`, `setAnalyticsEnabled` (Task 6).
- Produces: `enableReminder(time: string): Promise<boolean>` (requests permission; on denial stores `reminder_enabled = '0'`, tracks `reminder_permission_denied`, returns false; on grant stores `'1'` + time, tracks `reminder_enabled`, reschedules); `disableReminder(): Promise<void>`; `rescheduleReminders(now?: Date): Promise<void>` (cancel all scheduled, then schedule one notification per `reminderDates(now, time)` with `reminderLine(i)` as body; no-op when disabled).

- [ ] **Step 1: Write failing tests:** **Review Focus 4:** permission denied → returns false, `reminder_enabled === '0'`, no schedule calls, no throw; granted → 14 `scheduleNotificationAsync` calls, none on today's date; `rescheduleReminders` cancels before scheduling; disabled → zero schedule calls.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement `reminders.ts`. **Step 4:** Run → PASS.
- [ ] **Step 5:** Implement `settings.tsx`: reminder Switch + time picker (if denied, show "Notifications are off for Mindbed. Turn them on in iOS Settings." with a button calling `Linking.openSettings()`); **Manage beds** (`ManageBeds`: Ideas listed but locked; add bed (at 6+ user beds show "Gardens grow best with a few beds 🌱" but still allow it); rename, recolor from 6 swatches, delete with "Its plants will move to Ideas" confirm, reorder via `react-native-draggable-flatlist`; if drag misbehaves in Expo Go, replace with Up/Down buttons per spec); "Change who you are" (persona picker); "Share anonymous usage data" Switch (calls `setAnalyticsEnabled`) with the note "Only actions like 'planted' or 'watered', never what you write."; version label.
- [ ] **Step 6: Owner review:** enable the reminder for 2 minutes from now, close the app, and receive the notification; reopen the app, confirm today's is cancelled (set the time again 2 min ahead while the app stays open → no notification today); in PostHog › Activity, confirm events arrive with no thought text; turn the analytics toggle off → no new events.
- [ ] **Step 7: Commit** `feat: daily reminder, settings, analytics toggle`

### Task 12: Polish and full check

**Files:**
- Modify: components and screens from Tasks 7–11 as needed
- Create: `docs/qa-checklist.md`

- [ ] **Step 1:** Write `docs/qa-checklist.md` with the manual checks: onboarding fresh install; each Review Focus item; Reduce Motion on (iOS Settings › Accessibility › Motion) → no grow/bloom/slide animation, app still works; very long thought (140 chars) shows a 2-line clamp on the stake and full text in detail; a bed with 12 plants scrolls horizontally; empty Garden month; change the iPhone time zone → greeting follows; data persists after force-quit.
- [ ] **Step 2:** Run `npx jest` → all suites PASS; run `npx tsc --noEmit` → no errors.
- [ ] **Step 3:** Owner runs the QA checklist on the iPhone; fix anything that fails (each fix with a test where the logic is in `src/domain`, `src/db`, or `src/store`).
- [ ] **Step 4: Commit** `chore: polish and QA checklist`

---

**Out of this plan:** Milestone 7 (Apple Developer account, EAS Build, TestFlight) is a separate plan, made after the owner's own week of use.
