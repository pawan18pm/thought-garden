# Mindbed: Technical Design

> Date: 2026-11-19 · Status: draft for approval
> Product source of truth: [SRD](../../srd.md) · [Problem Framing](../../problem-framing.md)
> Visual reference: style board (design board, private): "Design system" artboard (tokens, 4 plant stages as SVG, stake, pill tab bar, PLANT IT button, bed) and "Plant tab" artboard (390×844 screen). Treat its SVG paths and measurements as the spec for those components.

This document covers **how** to build the MVP defined in SRD §5.3 and §9 to §10. Product decisions live in the SRD and aren't repeated here unless the build needs a precise rule.

## 1. Intent

A personal PM-portfolio iOS app that students use to capture thoughts instantly, sort them into custom beds, water them as they work, and bloom them when done, with a calendar showing each day's activity. The owner tests on their own iPhone. Success means the core loop feels instant and calm, and the app is solid enough for 10 to 20 testers.

**Goals:** a fast capture path (under 3 seconds); a reliable offline experience; visuals that match the style board; code clear enough to extend in Phase 2/3.
**Non-goals:** accounts/login, sync, own backend, payments, Android polish, widgets, share extension. (Phase-wise plan for these: [tech-stack-roadmap.md](../../tech-stack-roadmap.md).)
**Anti-goals:** anything that adds a decision to capture; any guilt mechanic (streaks, "you missed" copy); notifications beyond one a day.

## 2. Approaches considered

| Approach | Trade-off | Decision |
|---|---|---|
| **React Native + Expo (managed), tested in Expo Go** | One JS codebase; instant on-device testing by QR code; no Xcode needed. Limited to Expo Go's built-in native modules | ✅ **Chosen by the owner** |
| Installable web app (PWA) | Fastest to build, works on laptop too; weaker iOS feel and notifications | Rejected: owner wants a true app |
| Native Swift / SwiftUI | Best iOS fidelity; needs a Mac + Xcode, slower | Rejected: build speed and tooling |

**Constraint from the choice:** the MVP must run in **Expo Go** on iOS. Only use libraries bundled with Expo Go (all listed below are). A development build is only needed later (share extension, widgets: Phase 2/3).

## 3. Stack (builder's calls, stated)

| Concern | Choice | Why |
|---|---|---|
| Framework | Expo SDK (latest stable at build time), TypeScript | Owner's choice; types catch data bugs |
| Navigation | `expo-router` (file-based): onboarding stack + 2-tab layout | Standard in Expo; simple |
| Storage | `expo-sqlite` (on-device SQLite) | Relational data (beds, plants, waterings), date queries for the calendar |
| State | `zustand` store over a thin repository layer | Small and simple; the UI reads the store, the store writes through repositories |
| Drawing | `react-native-svg` | Plant stages and the circular "PLANT IT" text are SVG (as in the style board) |
| Animation | `react-native-reanimated` | Grow/bloom animations, sheet slide-up |
| Gestures | `react-native-gesture-handler` + `react-native-draggable-flatlist` | Drag to reorder beds (verify Expo Go compatibility at setup; fall back to Up/Down buttons in bed settings if it doesn't work) |
| Notifications | `expo-notifications` (local only) | Daily reminder; local notifications work in Expo Go on iOS |
| Fonts | `@expo-google-fonts/bricolage-grotesque`, `@expo-google-fonts/inter` | Matches the style board |
| Product analytics | `posthog-react-native` (PostHog Cloud, free tier) | Funnels, retention (D1/D7/D30), paths; runs in Expo Go; anonymous per-install ID, no login |
| Dates | `date-fns` | Local-day math (start of day, week, month grids) |
| Tests | `jest-expo` + `@testing-library/react-native` | Unit-test domain logic; component tests for key flows |

## 4. Architecture

```
app/                      expo-router screens
  _layout.tsx             fonts, DB init, redirect to onboarding if not done
  onboarding/             welcome, persona, beds, first-plant, reminder
  (tabs)/_layout.tsx      floating pill tab bar
  (tabs)/plant.tsx        Plant tab
  (tabs)/garden.tsx       Garden tab
  garden/[date].tsx       Day detail
  settings.tsx            Settings (opened from header)
src/
  domain/                 pure TypeScript: types, rules, no React or DB
    stages.ts             water count → stage
    ordering.ts           plant sort within a bed
    dayState.ts           day activity → calendar state
    greeting.ts           local hour → greeting
    personas.ts           persona → suggested beds
    reminder.ts           which upcoming dates get a reminder
  db/                     SQLite schema, migrations, repositories
  store/                  zustand store (beds, plants, settings)
  ui/                     design tokens + components (Bed, PlantStake,
                          PlantArt, PlantItButton, PillTabBar, Sheet…)
  notifications/          schedule/cancel wrapper around expo-notifications
```

**Rule:** all product rules live in `src/domain` as pure functions and are developed test-first. Screens stay thin.

## 5. Data model (SQLite)

```
beds
  id TEXT PK, name TEXT, color TEXT (token key), position INTEGER,
  is_ideas INTEGER (1 for the permanent Ideas bed), folded INTEGER,
  created_at TEXT (ISO)

plants
  id TEXT PK, bed_id TEXT FK → beds, text TEXT,
  priority INTEGER NULL (3 high, 2 medium, 1 low, NULL none),
  created_at TEXT, bloomed_at TEXT NULL, deleted_at TEXT NULL

waterings
  id TEXT PK, plant_id TEXT FK → plants, watered_at TEXT

settings (key TEXT PK, value TEXT)
  onboarding_done, persona, reminder_enabled, reminder_time ("21:00"),
  last_opened_date
```
(Analytics events are not stored locally; they go to PostHog, see §9.)

- All timestamps are stored in ISO with offset; **"day" always means the device's local calendar day**.
- Deletes are soft (`deleted_at`) for safety, but a deleted plant is **hidden everywhere, including the calendar, weekly strip and day detail**: all queries filter `deleted_at IS NULL`. *(Builder's call: simplest and matches "delete" intent.)*
- IDs: random UUIDs (`expo-crypto`).

## 6. Product rules, precisely

- **Stage:** 0 waterings → seed; 1 → watered; 2+ → growing; `bloomed_at` set → bloom. Bloom is allowed from any stage.
- **Ordering inside a bed:** priority desc (NULL counts as lowest, same as Low), then `created_at` desc.
- **Bloomed plants** leave their bed. The Plant tab shows a "Bloomed today (n)" row at the bottom listing today's blooms; tapping one offers **Undo bloom**. Older blooms appear only in the Garden.
- **Watering:** one tap adds one watering row (no limit). The detail sheet shows the count.
- **Ideas bed:** created during onboarding, always present, cannot be deleted, renamed or reordered; **pinned last** in the list; uses a neutral color (paper #FFFFFF with soil strip), **not** one of the 6 bed colors; does **not** count toward the bed limit. Default target when no bed is chosen. Deleting another bed moves its plants to Ideas (with a confirm dialog).
- **Beds:** 1 to 6 user beds in onboarding (hard cap there); later in Settings a 7th+ is allowed with a gentle note, never blocked. Colors are auto-assigned in order from the 6 bed tokens (cycling if more), and the user can change them. *(Builder's calls.)*
- **Reordering beds happens in Settings › Manage beds only** (drag list, Up/Down fallback), not on the Plant tab, to avoid nested-gesture risk. *(Builder's call; SRD §5.3 updated to match.)*
- **Day state (calendar):** for a local day, using that day's events only: nothing → `empty`; planted but no waterings or blooms → `planted`; one or more waterings and no blooms → `watered`; one or more blooms → `bloomed`.
- **Weekly strip:** Monday to Sunday of the current week; counts blooms and waterings.
- **Greeting:** 05–11 morning, 12–16 afternoon, 17–20 evening, 21–04 night, from the device's local hour.
- **Persona → suggested beds:** Student: Subjects, Exams, Assignments, Skills · Job prep: Interview, DSA, Resume, Portfolio · Professional: Work, Upskilling, Side project · Builder: Ideas to explore, Build, Learn, Launch. All are editable; the user keeps any number from 1 to 6.

## 7. Screens and flows

**Onboarding** (only while `onboarding_done` is false): Welcome → Persona → Beds (suggestions as toggleable chips plus "Add bed"; rename inline) → First plant (sheet with the text field focused, bed preselected to the first persona bed the user kept, not Ideas; on submit a seed-to-shoot animation plays and the plant gets one auto-watering to show growth) → Reminder (Morning 08:00 / Evening 21:00 / Pick a time / Not now). The OS permission prompt fires only on "Yes". If permission is denied, the reminder is saved as off and Settings explains how to enable it → Plant tab.

**Plant tab:** header (Settings button only; no "More" menu in the MVP) → greeting line → "Plant" title → beds as a vertical list (each bed: header with name and count, then a horizontal scroll of plants on soil; tap the header to fold; a small "+" in the header plants directly into that bed) → "Bloomed today" row → floating PLANT IT button → pill tab bar.

**Planting sheet:** a bottom sheet, keyboard auto-focused; text (required, 1–140 chars, trimmed); bed chips (default: the bed whose "+" was tapped, else the last used bed, else Ideas); priority chips ▲▲ / ▲ / – (default none). Return key = Plant it. After saving, the sheet closes, the new plant animates into its bed, and the bed auto-unfolds and scrolls to it.

**Plant detail sheet** (tap a plant): art at its current stage, full text (editable), bed and priority, water count, buttons **Water** and **Bloom**, then links: Change priority, Move bed, Delete (with confirm).

**Garden tab:** weekly strip → month calendar (swipe or arrows between months; today highlighted; each day cell shows its state icon) → tap a day → Day detail lists Bloomed, Watered, and Planted for that day, each with a bed color dot.

**Settings:** reminder toggle + time; manage beds (rename, recolor, reorder, delete); change persona (only affects future suggestions); "Share anonymous usage data" toggle; app version.

## 8. Daily reminder logic

A repeating daily trigger can't be skipped for one day, so:
- On every app foreground: record `last_opened_date = today`, cancel all scheduled reminders, and schedule **one-off reminders for the next 14 days at the chosen time, skipping today** (the user has opened the app today).
- On a day the app is never opened, the pre-scheduled reminder fires. After 14 days with no open, reminders stop on purpose: a gentle app doesn't nag someone who has left. *(Builder's call; well under iOS's 64-pending limit.)*
- Copy rotates from a small list of gentle lines (e.g. "Your garden's waiting. Anything to water today? 🌙"). No guilt language.
- `domain/reminder.ts` computes the dates as a pure function (now, time, last opened) → dates, so it's testable.

## 9. Metrics collection (resolves the SRD TBD)

**PostHog** (owner's decision). The only network traffic in the MVP is anonymous analytics events sent to PostHog. User data (thoughts, beds) never leaves the phone.

- **Identity:** PostHog's anonymous per-install ID. No login, no email, no name.
- **Events:** `onboarding_step_viewed {step}`, `onboarding_completed {persona, beds_count}`, `app_opened`, `plant_created {has_priority, priority, bed_is_ideas, source: 'fab'|'bed_plus'|'onboarding'}`, `plant_watered {water_count}`, `plant_bloomed {water_count, age_days}`, `bloom_undone`, `plant_deleted`, `bed_created`, `bed_deleted`, `garden_viewed`, `day_opened`, `reminder_enabled {time}`, `reminder_disabled`, `reminder_permission_denied`, `reminder_opened` (app opened from a notification).
- **Privacy:** event properties are numbers, booleans and fixed enums only. **Never thought text or bed names.** Enforced by a typed `track()` wrapper whose property types can't hold free text.
- **Config:** API key from `EXPO_PUBLIC_POSTHOG_KEY`. If the key is missing, analytics is a silent no-op (the app works the same).
- **Disclosure:** Settings shows "Share anonymous usage data" (on by default) with the note "Only actions like 'planted' or 'watered', never what you write." Turning it off calls PostHog opt-out.
- **Dashboards (owner sets up in PostHog):** onboarding funnel, D1/D7/D30 retention on `app_opened`, weekly waters and blooms per user.
- **"Active day"** = a local day with at least one `app_opened` event. Engagement (waters + blooms) is reported separately. D7 = active on day 7 after `onboarding_completed`; D30 likewise. *(Builder's calls.)*

## 10. Visual system

Tokens come from the style board:
- **Colors:** paper #FBF7EF, ink #1C1B19, muted #5E5A52, soil #B8875A, seed #7A5230, leaf #3F9142, leaf-light #7CC47F; bed colors #D6E6FF, #FFE0C7, #E8DDFF, #FFF1B8, #DDF2D1, #FFD9E4.
- **Type:** Bricolage Grotesque 800 for titles (44), 700 for bed names (20–22); Inter 400/600 for body and labels.
- **Shape:** card radius 22; 2px ink border; offset shadow 4px 4px (ink, or the leaf color on the primary action).

Plant art is our own SVG (four stages). Touch targets are at least 44pt. Respect iOS Reduce Motion: skip grow/bloom animations when it's on.

## 11. States and edge cases

Empty bed ("Empty soil · plant your first thought here"); empty Garden month; very long text (2-line clamp on the stake, full in detail); a bed with many plants (horizontal scroll); notification permission denied; day boundaries at local midnight; the user changes time zone (everything uses the current device zone; past items keep their stored timestamps); app killed mid-animation (data is saved before the animation plays).

## 12. Testing

- **Test-first** for everything in `src/domain` (stages, ordering, day state, greeting, personas, reminder dates).
- Repository tests against an in-memory SQLite where possible, else a mocked adapter.
- Component tests: planting sheet (submit with only text → plant lands in Ideas), plant detail (water increments, bloom moves to Bloomed today), onboarding happy path.
- Manual on-device checklist per milestone in Expo Go on the owner's iPhone.

## 13. Milestones (each reviewable on the iPhone)

1. **Skeleton:** Expo app, fonts, tokens, tab bar, SQLite set up. Opens in Expo Go.
2. **Plant core:** beds, planting sheet, plant art, water and bloom, ordering. *First prototype to review.*
3. **Onboarding:** persona, beds, first plant.
4. **Garden:** calendar, day detail, weekly strip.
5. **Reminder + Settings + events export.**
6. **Polish:** animations, empty states, Reduce Motion, owner's own 1-week use.
7. **Tester release (owner's decision: option A):** the owner builds and tests alone in Expo Go through milestone 6. Only then: Apple Developer account ($99/yr), EAS Build, TestFlight distribution to 10 to 20 testers. Nothing before this milestone depends on it; the Expo Go-only constraint holds until here.

## 14. Left to the builder

Exact component APIs, file names inside the folders above, animation timings, the copy list for reminders, and the month-calendar implementation (custom grid is fine).
