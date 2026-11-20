# Mindbed MVP: Build Notes

> Built 2026-11-20 with subagent-driven development (12 tasks, each reviewed, plus a final whole-branch review: Ready to merge).

## Decisions made during the build (rulings)

- Ruling: skip T1 Step 1 (git init/.gitignore) — done in setup with `.superpowers/` also ignored — cost if wrong: none.
- Ruling: drop `expo-sharing` from T1 install — export feature replaced by PostHog — cost: trivial re-install.
- Ruling: store `plant(text, bedId?, priority?, source: 'fab'|'bed_plus'|'onboarding' = 'fab')` — spec §9 event needs source — cost: small signature change.
- Ruling: T6 store also tracks `plant_deleted`, `bed_created`, `bed_deleted`; T10 tracks `garden_viewed` (tab focus) and `day_opened` — spec §9 lists them — cost: minor.
- Ruling: app name is Mindbed (owner decision) — docs renamed; Task 1's placeholder title text to be corrected when it lands — cost: trivial
- Ruling: Expo SDK 58 template uses `src/app/` for routes and alias `@/*` → `src/*`; every plan path `app/...` means `thought-garden/src/app/...` — template convention, fighting it costs more — cost if wrong: path rename.
- Ruling: template's `.claude/settings.json` (enables the expo plugin only), `.vscode`, `AGENTS.md` kept — harmless template files — cost: none.
- Ruling: npm audit 3 moderate (transitive, dev tooling) left as-is for MVP; revisit before TestFlight — cost: low.
- Ruling: nextBedColor = first unused in BED_COLOR_ORDER, else ORDER[used.length % 6]; reminderDates start tomorrow at HH:mm; reminderLine = index mod length — reconciles the brief's two bedColors test lines — cost if wrong: trivial.
- Ruling (T5): Ideas bed name 'Ideas', list orders is_ideas ASC, position ASC; beds.remove(Ideas) throws; remove moves all plants (incl. bloomed/deleted) to Ideas then hard-deletes bed; reorder/rename/setColor ignore Ideas; detail.watered = distinct plants; month returns only active days; week inclusive — spec §5/§6 silent on these mechanics — cost if wrong: small repo edits.
- Ruling (T6): EventMap literal unions (step enum; reminder_enabled time as `${number}:${number}`; empty props Record<string,never>); setAnalyticsEnabled only opts in/out, store.setAnalytics persists 'analytics_enabled' '1'/'0', layout applies at boot; lastBedId in-memory; layout shows error text if DB init fails — keeps §9 privacy typing strict — cost if wrong: small.
- Task 6: review Needs fixes (2 Important). Ruling: amend ruling 8 — PostHog client gets captureAppLifecycleEvents:false, preloadFeatureFlags:false, disableRemoteConfig:true, disableSurveys:true, personProfiles:'never' — global constraint says only track() traffic; ruling 8 was incomplete — cost if wrong: lose nothing we use.
- Ruling (T7): offset shadow = solid backing View; BedCard renders plants in given order; PillTabBar exported only (wired in T8); style board HTML in session scratchpad is the visual source — cost if wrong: visual polish in T12.
- Ruling (T8): sheet passes source 'fab'|'bed_plus' (test expects 4 args); sheet passes only explicit/initial bed, store resolves default; tab routes plant/garden (PillTabBar map index→plant); placeholder src/app/settings.tsx; detail edits via inline chips, Alert confirm for delete & undo bloom; ref-based double-tap guard — brief vs. T7 route-name conflict and §7 details — cost if wrong: small UI edits.
- Ruling (T9): onboarding gate via boot result onboardingDone + index.tsx redirect (not layout effect); draft zustand; beds created on Beds Continue with ref guard; first plant source 'onboarding' + auto-water; reminder Yes saves settings only (T11 wires permission); datetimepicker for Pick a time; no back gesture after beds created — cost if wrong: small.
- Ruling (T10): useActivity hook over repos.activity, refresh on focus; garden_viewed on focus, day_opened on detail mount; future/padding cells not pressable; gentle empty-day copy; invalid date param → empty message — cost if wrong: small.
- Ruling (T11): initReminders(settings) from boot + setNotificationHandler; app_opened on resume only (boot covers cold start); bed reorder via Up/Down buttons (spec fallback; Expo Go reliability, owner wants simple) instead of draggable-flatlist; dev-only "Reset all data" (repos.resetAll + DevSettings.reload) for owner testing — cost if wrong: small.
- Task 11: review Needs fixes (2 Important: overlapping rescheduleReminders → dup/missing reminders; changeTime ignores enableReminder result). Ruling: amend ruling 4 — app_opened only on background→active (inactive→active still reschedules) — avoids inflating the D7 metric from permission prompt/Control Center — cost: none.
- Ruling (T12): polish scope = reduce-motion fade substitute + cached initial value; Water/Bloom in-flight guards; keyboard check on sheets/Settings; orderBeds helper; 140 counter/maxLength; plant a11y labels; validate time before prompt + clearLastNotificationResponseAsync; ManageBeds rename on blur/submit; QA checklist + README run notes. DB hardening minors (T5) left for final-review triage — cost if wrong: small.
- Ruling: final fix wave = Important 1+2, Minor 1 ("–" chip must save Low=1, no chip selected by default — spec §7 says default none), Minor 3 (boot Retry + render on font error), Minor 5 (keep reminder_time on denial) — cheap and user-visible; others deferred — cost if wrong: one extra fix wave.

## Deferred small issues (final review triaged all as fine to defer)

- Task 2: review Approved, spec ✅. ⚠️ BedColorKey export confirmed in tokens.ts. Minor parked: ordering test doesn't pin null-vs-Low when null is newer; Date.parse NaN on bad createdAt (app-generated, low risk).
- Task 3: review Approved, spec ✅. ⚠️ alias/date-fns: covered by implementer's green jest+tsc run. Minor parked: 00:00 dayKey test and nowIso-slice contract (midnight is pinned in Task 5 dayActivity); monthGrid Monday-start/6-row cases untested (logic traced correct).
- Task 4: review Approved, spec ✅. ⚠️ token order and Persona type confirmed by grep. Minor parked: reminderLine negative index, unvalidated time string (settings-sourced), extra rollover tests.
- Task 5: review Approved (opus), spec ✅. ⚠️ Bed.color includes 'ideas' and color order verified earlier (types.ts, tokens). Minor parked FOR FINAL REVIEW: shared-connection BEGIN/COMMIT in beds.remove (consider Db.transaction → withExclusiveTransactionAsync); PRAGMA foreign_keys off; ensureIdeas race (partial unique index); RF3 test should include bloomed+deleted plants; reorder not transactional.
- Task 6: minor (deferred): plant_watered water_count from pre-state+1; no tests on event prop values; analytics test env restore not in finally; plant() may call ensureIdeas redundantly.
- Task 6: minor (deferred): __setClientForTests resets initialised flag (test-only).
- Task 7: minor (deferred): plant a11y label lacks priority/stage; useReducedMotion initial false (first sheet may slide); deep type import comment; no tests for Sheet/PillTabBar/ChunkyButton; hardcoded #FFFFFF/#F28AA8/#FFD84D.
- Task 8: minor (deferred): planting sheet reset 1-frame flash; unhandled rejections from store calls; no in-flight guard on Water/Bloom (double tap); bed sort duplicated 3× (extract orderBeds); PRIORITY_CHIPS coupling; detail edit no maxLength/feedback; typed routes need expo start once (doc note); no tests for plant.tsx/BloomedTodayRow; §7 animate-into-bed + scroll-to-plant not done.
- Task 8: minor (deferred): bloom regression test doesn't discriminate old code; fake timers not in try/finally.
- Task 9: minor (deferred): app killed between bed creation and onboarding_done → beds re-created on next onboarding (rare); no dup/Ideas-name check; blank rename on blur; tests mocked only / confusing 0-selected test; no datetimepicker test; package.json reformat noise.
- Task 9: minor (deferred): after partial failure, rename/deselect of already-created bed not synced; setPersona after partial failure drops bedIds.
- Task 10: minor (deferred): day_opened fires on invalid date; detail reject leaves blank; todayKey no midnight rollover; cast in useActivity.
- Task 10: minor (deferred): StrictMode double garden_viewed (dev-only); failed mount load not retried until next focus.
- Task 11: minor (deferred): reminder_opened double/carry-over (clearLastNotificationResponseAsync); invalid time validated after prompt; stale reorder quick taps; rename only on onEndEditing; heading "Who are you" vs "Change who you are"; no Settings render test; resetAll not transactional.
- Task 12: minor (deferred): ChunkyButton mocked in double-press test; ManageBeds rename saved flag set before rejectable call; reduced-motion cold first render; README duplicate template text.

### Also deferred from the final review
- First-plant has a stage swap, not a real seed→shoot animation; under Reduce Motion the grown state isn't shown.
- lastBedId is in memory only (planting default resets to Ideas after relaunch).
- Changing reminder time re-sends reminder_enabled.
- plantsInBed getter used as a selector (works; prefer filtering in component).
- Garden uses paddingTop 64 instead of the safe-area inset.
- Unused deps: react-native-draggable-flatlist, @expo/ui, expo-glass-effect, expo-symbols.
- onboarding_completed isn't tracked if the app is killed on the Reminder screen.
- Before TestFlight: re-check npm audit; withExclusiveTransactionAsync for beds.remove.

## Bloom + Garden redesign (2026-11-20)
Commits 530a96a..8c83208. Plant tab header + Bloomed-today card at top; Garden soil-tile calendar, week card, day-detail cards; day-rollover refresh of bloomed-today.
Deferred minors:
- Bloomed-today flowers cluster left instead of spreading evenly; a few hex colors (#FFFFFF, #FFD84D) outside tokens; summary chips row has no flexWrap.
- PlantArt's own soil ellipse slightly overlaps the calendar tile soil strip (check on device).
- Card goes stale if the app stays in the foreground across midnight with no action (refreshes on next foreground); Garden tab refreshes on focus only.
- One redundant reload after a post-midnight bloom + foreground (harmless).
