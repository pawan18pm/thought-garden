# Tech Stack Roadmap: Thought Garden

> Date: 2026-11-19 · Owner decision: build the **MVP** column now; Phase 2/3 are for future review.
> Related: [SRD](srd.md) · [Technical design](superpowers/specs/2026-11-19-thought-garden-design.md)

## Phase-wise stack

| Area | 🌱 MVP (now) | 🌿 Phase 2: Growth | 🌳 Phase 3: Pro |
|---|---|---|---|
| **App** | React Native + Expo | Same | Same |
| **App data** | SQLite on the phone | SQLite on the phone | SQLite + **Supabase** cloud sync |
| **Product analytics** | **PostHog** (anonymous) | PostHog + feature flags for A/B tests | PostHog + RevenueCat subscription analytics |
| **Login** | None (anonymous install ID) | None | **Sign in with Apple** (via Supabase Auth) |
| **Payments** | None | None | **RevenueCat** (wraps Apple In-App Purchase) |
| **Distribution** | Expo Go (owner only) | TestFlight (10–20 testers) | App Store |
| **Native extras** | — | Share from YouTube/Safari (needs EAS dev build) | Widgets, iPad/Mac |
| **Cost** | Free | Apple Developer $99/yr | + Supabase / RevenueCat free tiers until real revenue |

## Why each choice

- **SQLite on the phone:** fast, offline, private. A cloud database is only worth it once users want sync.
- **PostHog:** funnels and D1/D7/D30 retention out of the box, works in Expo Go, free tier. Sends actions only, never thought text.
- **No login in the MVP:** a sign-up screen hurts activation and gives no value until sync exists.
- **Supabase (Phase 3):** database + login + storage in one service, Postgres-based, free tier.
- **Sign in with Apple:** easiest on iPhone, and Apple expects it when other social logins are offered.
- **RevenueCat, not Stripe, for in-app Pro:** Apple generally requires its In-App Purchase for digital features unlocked inside an iPhone app. RevenueCat manages that, plus trials and lifetime. **Stripe** fits only if Pro is later sold on a website. *(Apple's rules have been loosening in some regions; re-check at Phase 3.)*

## Triggers to move to the next phase

| Move to | When |
|---|---|
| Phase 2 | Owner has used the MVP daily for 1–2 weeks and the core loop feels right |
| Phase 3 | Testers hit D7 ≥ 30% and ask for sync or more beds |

## Things to keep in mind (any phase)

1. **App Store privacy label:** PostHog counts as "usage data collected, not linked to identity". Declare it when publishing (Phase 2+).
2. **Privacy policy page:** required for TestFlight/App Store once analytics is on. A simple one-page site is enough.
3. **Data loss risk:** MVP data lives only on the phone. Deleting the app deletes the garden. Say so to testers; sync fixes it in Phase 3.
4. **Keys and secrets:** the PostHog key lives in `.env` (git-ignored). Never commit keys.
5. **Expo Go limits:** share extension and widgets need an EAS development build, so they stay in Phase 2+.
6. **App name and icon:** App name is **Thought Garden**. Check App Store name availability before Phase 2.
7. **Backups of your own work:** the project uses git locally. Push to a private GitHub repo for safety (portfolio link later).
