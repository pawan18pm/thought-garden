# Mindbed QA checklist (iPhone, Expo Go)

Run on the owner's iPhone. Tick each box; note anything that fails.

## Fresh install and onboarding
- [ ] Delete Mindbed data (Settings > Reset all data) or use a fresh Expo Go project; the app opens in onboarding.
- [ ] Persona, first plant and reminder steps all work; the keyboard never covers the footer button.
- [ ] After onboarding, the Plant tab shows the first plant and the starter beds.

## Planting
- [ ] Whitespace-only thought: Plant it stays disabled.
- [ ] 141-character thought: counter turns red and Plant it is disabled; 140 characters plants fine.
- [ ] Double-tap Plant it quickly: only one plant is created.
- [ ] Priority chips and bed chips choose the right bed and priority.
- [ ] Keyboard open: the Plant it button and chips stay visible above the keyboard.

## Water, bloom and edit
- [ ] Water: art pulses, water count goes up, stage advances. Double-tap Water: counts once.
- [ ] Bloom: plant blooms, sheet closes, plant appears in "Bloomed today"; Undo brings it back.
- [ ] Edit text in the detail sheet: the field stops at 140 characters and shows the n/140 counter; Save works.
- [ ] Change priority and Move bed from the detail sheet.
- [ ] Delete a plant asks for confirmation.
- [ ] A 140-character thought shows a 2-line clamp on the stake and the full text in the detail sheet.
- [ ] A bed with 12 plants scrolls horizontally.

## Midnight boundary
- [ ] Bloom a plant just before midnight (or change the phone clock): after midnight it leaves "Bloomed today" and appears under the right day in Garden.

## Beds
- [ ] Settings > Manage beds: rename (return key, tapping away both save), recolor, reorder, add.
- [ ] Delete a bed that has plants: confirmation appears, plants move to Ideas, none are lost.
- [ ] Ideas bed is locked (no rename, move or delete) and always last.
- [ ] Keyboard open in Settings: the field you are typing in scrolls into view; dragging the list dismisses the keyboard.

## Garden calendar
- [ ] A month with bloomed plants shows them on the right days.
- [ ] An empty month shows the empty state and does not crash.
- [ ] Change the iPhone time zone (Settings > General > Date & Time): the greeting follows the new local time.

## Accessibility
- [ ] Reduce Motion ON (iOS Settings > Accessibility > Motion): no sheet slide, no grow or bloom scale, PLANT IT ring stays still, and the app still works.
- [ ] With Reduce Motion ON, Water and Bloom still give a quick fade flash on the plant.
- [ ] VoiceOver reads plants as, for example, "High priority: Learn SQL, growing".

## Reminders
- [ ] Settings > Daily reminder: turn on, allow notifications, set a time 2 minutes ahead; the notification arrives and tapping it opens the app.
- [ ] Notification permission denied: the switch returns to off and the "Open iOS Settings" note appears.
- [ ] Turn the reminder off: no further notifications.

## Privacy
- [ ] Settings > Share anonymous usage data off: the toggle stays off after restarting the app.

## Persistence and reset
- [ ] Force-quit the app and reopen: plants, beds, settings and today's blooms are all still there.
- [ ] Settings > Reset all data (dev) restarts the app and reruns onboarding.
