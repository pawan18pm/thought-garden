# 🌱 Thought Garden

**Plant a thought. Watch it bloom.**

A calm, minimal app for students and early-career learners to catch ideas the moment they appear, sort them into their own topic **beds**, and make progress visible: **water** a thought each time you work on it, and it **blooms** when it's done.

**▶ Try it live:** [thought-garden.expo.app](https://thought-garden.expo.app). It works in any browser. On your phone, use *Share → Add to Home Screen* to open it like an app.

> A product-management portfolio project, taken from problem framing to a shipped app.

---

## The problem

Students juggling studies, interview prep and side projects have far more thoughts than time. Ideas show up mid-lecture or halfway through a tutorial and get lost in notes apps, chats and screenshots. Partial progress isn't recorded anywhere, and to-do or streak apps punish missed days, so people quit them.

**Job to be done:** *"When a thought comes to me while I'm studying, help me catch it instantly, put it where it belongs, and see it grow as I work on it."*

## The solution

| | |
|---|---|
| 🌰 **Plant** | One always-open box: type a thought, pick a bed, done in about 3 seconds. |
| 🛏️ **Beds** | Your own topics (e.g. Exams, Interview, Side project). Fully customizable, or start blank. |
| 💧 **Water** | Tap Water each time you work on it. Three drops show progress. |
| 🌸 **Bloom** | It blooms automatically on the 3rd water, or tap the flower to bloom early. |
| 📅 **Garden** | A soil-tile calendar: each day grows the plant you tended. Tap a day to see what bloomed, was watered or planted. |

No streaks, no guilt, no sign-up. Your data stays on your device.

## Product decisions

- **Beds first.** Every thought belongs to one bed, chosen in a Duolingo-paced onboarding (one question per screen, first win in under a minute).
- **One action per thought.** Water or Bloom. Early prototypes with notes, next steps and due dates were cut because they made it feel like another to-do app.
- **Auto-bloom at 3 waters.** Gives a clear finish line, while "Bloom now" covers one-step tasks.
- **Reward without pressure.** Flowers in the calendar and a monthly bloom count, but no streak counters.
- **Privacy by default.** Thoughts never leave the device. Optional analytics send actions only, never your text.

The full process (problem framing, requirements, six design iterations and the build plans) is in [`docs/`](docs). The early docs use the working name *Mindbed*.

**Success metrics (MVP):** 60%+ plant a thought on day 1 · 30%+ active on day 7 · 15%+ active on day 30.

## Built with

React Native · Expo (SDK 58) · Expo Router · SQLite (on-device) · Zustand · react-native-svg · PostHog (optional, anonymous) · Jest + Testing Library (200+ tests) · deployed with Expo Hosting.

## Run it yourself

```bash
cd thought-garden
npm install
npx expo start          # scan the QR code with Expo Go
npx expo export -p web  # build the web version
```

Optional analytics: copy `thought-garden/.env.example` to `.env` and add a PostHog key.

## Author

**Pawan**: aspiring product manager. Built with the help of Claude (Anthropic) as an AI pair-programmer.

## License

[MIT](LICENSE)
