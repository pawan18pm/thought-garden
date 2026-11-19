# SRD — Thought Garden (working title)

> Version: V0.1
> Date: 2026-11-19
> Author: Project owner (PM portfolio project)
> Related: [Problem Framing](problem-framing.md)

---

## 1. Customer

- **Primary:** self-driven college students and job-seekers (about 17 to 25) pursuing several learning goals at once, such as interview prep, design, AI fundamentals, and side projects. They learn from lectures, YouTube, and courses, and capture thoughts on their phone during study and breaks.
- **Secondary:** students who feel overwhelmed and need gentle structure rather than pressure.
- **Onboarding segments** ("Who are you?"): 🎓 Student · 💼 Preparing for a job · 🧑‍💻 Working professional · 💡 Builder / has ideas. The answer only changes the suggested beds; the app is the same for everyone.

## 2. Job to be Done

When a thought comes to me while I'm studying, help me catch it instantly, put it in the right place, and see it grow as I work on it, so nothing important gets lost and I can see my progress.

## 3. Benefit

### 3.1 Customer Value

- Capture a thought in about 3 seconds. Only the text is required.
- Thoughts organized into **custom beds** that match how the user already thinks (e.g. Interview, Design, Claude Code, AI Fundamentals).
- Effort is visible before completion: each **watering** logs a work session.
- A guilt-free experience: no streaks, no punishment for missed days.
- A clear picture of each day in the **Garden** calendar.

### 3.2 Business Value

- **MVP goal:** validate a daily return habit with 10 to 20 student testers (see §6).
- **Business model (post-MVP): freemium.** The core loop (plant, water, bloom, calendar) stays **free forever**, and a **Pro** tier adds extras.

| 🌱 Free | 🌳 Pro |
|---|---|
| Unlimited plants | Everything in Free |
| Up to 4 custom beds | Unlimited beds |
| Water, bloom, Garden calendar, weekly strip | Sync across iPhone, iPad, and Mac |
| One daily reminder | Insights (most-grown bed, monthly report) |
| | Garden themes (seasons, night garden) |
| | Home-screen widgets |
| | Share from YouTube or Safari into a bed |

- **Pricing direction:** student-friendly. About ₹99/month or ₹699/year in India, about $2.99/month elsewhere, plus a lifetime option.
- **Rejected models:** ads (they break the calm, distraction-free promise); one-time purchase only (no recurring revenue).
- **Later growth path:** student referrals through a shareable garden card, campus communities, and possibly B2B (coaching institutes and bootcamps).

### 3.3 Brand Impact

A calm, playful, guilt-free study companion: "your thoughts, growing." As a portfolio piece, it demonstrates end-to-end PM ownership, from problem framing through business model, metrics, and a shipped app.

## 4. Problem

1. **Thoughts get lost.** Ideas appear mid-lecture or mid-video and vanish before they're written down. Opening a heavy app breaks focus.
2. **No order.** Captured thoughts are scattered across notes apps, "message to self" chats, screenshots, and paper, with no topic or priority.
3. **Invisible progress.** Partial effort (a topic studied over several sessions) isn't recorded, so students feel they achieved nothing.
4. **Guilt-driven tools.** To-do and streak apps assume you've already decided what to do, and punish missed days. Students abandon them.

**When it happens:** during study (capture), mornings (deciding what matters), breaks and evenings (logging effort), and weekly (looking back).

## 5. Solution

### 5.1 Benchmark Analysis

**timespent (iOS):** a minimal activity tracker.

| | timespent | Thought Garden |
|---|---|---|
| Starts from | Activities you already do (Reading, Running) | Loose thoughts that pop up while studying |
| Core action | Timer session or tally | Plant, then water, then bloom |
| Progress view | Heatmap per activity | Garden calendar per day |
| Organization | One card per activity | Custom beds with priority inside |

**What we borrow (style, not assets):** a founder-letter warmth on the first screen, chunky cards with colored offset shadows, a floating pill tab bar, a spinning circular-text action button, a large bold title with generous white space, and a friendly empty state.
**Our gap to own:** timespent tracks decisions already made. We cover the step before that: catching thoughts and growing them into done work.

### 5.2 Before/After Comparison

| Before | After |
|---|---|
| Thought written in a notes app or WhatsApp, then forgotten | Planted in about 3 seconds into the right bed |
| No idea what matters most | Priority (▲▲ / ▲ / –) puts the important plants at the front of each bed |
| Studied SQL for three sessions, nothing to show | 💧💧💧 watered three times, plant visibly growing |
| Missed a day, felt guilty, quit the app | No streaks. The next day starts fresh |
| "What did I even do this week?" | Garden calendar plus the "🌸 12 bloomed this week" strip |

### 5.3 Scope (In / Out)

| In Scope (MVP) | Out of Scope (later) |
|---|---|
| **Onboarding:** Welcome, "Who are you?", custom beds (persona-based suggestions, editable), guided first plant, optional daily reminder | Category types (Learn / Do / Build) |
| **Plant tab:** time-of-day greeting; custom beds stacked vertically; plants sorted by priority inside each bed; horizontal scroll per bed; fold or unfold a bed; "+" to plant into a specific bed (beds are reordered in Settings) | Sky that clears with activity |
| **Planting sheet:** thought text (required); bed (optional, defaults to 💡 Ideas); priority ▲▲ / ▲ / – (optional) | Weekly garden walk (impact × effort review) |
| **Plant actions:** water 💧 (grows a stage), bloom 🌸 (done), change priority, move bed, delete | Milestones, seasons, Harvest/Trophy tab |
| **Plant stages:** seed, watered, growing, bloom | Shareable garden card |
| **Garden tab:** month calendar with a day state per day; tap a day to see what was bloomed, watered, and planted; weekly bloom strip | Sync, accounts, login |
| **Daily reminder:** optional, one per day, user-chosen time, skipped if the app was opened that day | Share from YouTube or Safari |
| **Settings:** reminder on/off and time; manage beds; change "Who are you?" | Widgets, iPad, Mac, Android testing |
| **Data stored on the device only**; anonymous usage analytics (PostHog), with an opt-out toggle | Pro tier and payments |

### 5.4 Phasing

| Phase | Scope | Goal | Depends on |
|---|---|---|---|
| **Phase 1: MVP** | §5.3 In Scope | Prove the habit: activation and D7/D30 retention with 10 to 20 student testers | — |
| **Phase 2: Growth** | Shareable garden card, share-from-YouTube/Safari, milestones, Category types if requested | Acquisition and referral | Phase 1 retention targets met |
| **Phase 3: Pro** | Sync, insights, themes, widgets, unlimited beds, payments | Revenue (2 to 5% conversion) | Phase 2 |

## 6. Success Metrics

The metrics follow the product lifecycle: Acquisition → Activation → Engagement → Retention → Revenue, plus Referral.

| Metric Type | Stage | Metric | Target |
|---|---|---|---|
| **Primary** | Retention | % of users active on Day 7 | 30%+ |
| Observation | Activation | % who plant their first thought on day 1 | 60%+ |
| Observation | Activation | % who complete onboarding | 80%+ |
| Observation | Engagement | Waters + blooms per active user per week | Directional: track the trend |
| Observation | Retention | % active on Day 30 | 15%+ |
| Observation | Retention | % who turn on the daily reminder | Directional |
| Personal | — | Project owner uses it 5+ days a week for 4 weeks | Yes / No |
| Later | Acquisition | Installs per week | Phase 2 |
| Later | Revenue | Free → Pro conversion | 2 to 5% (Phase 3) |

**Collection:** anonymous product analytics with **PostHog** (actions only, never thought text). See [tech-stack-roadmap.md](tech-stack-roadmap.md) for the phase-wise stack.

## 7. Risks & Mitigation

| Risk Type | Risk | Mitigation |
|---|---|---|
| Product | Capture feels slow, so users fall back to the notes app | Only text is required; keyboard opens instantly; bed and priority are optional; default bed is Ideas |
| Product | Two color systems (bed color plus priority color) confuse users | Color means bed only. Priority uses position and ▲ markers, never color |
| Product | Too many custom beds turns into clutter | Suggest about 6 beds; beds fold; 💡 Ideas bed catches everything unsorted |
| Product | Users don't return (retention) | Guided first plant; one optional daily reminder; no guilt mechanics |
| Product | Notification permission denied | Ask only after the first plant (value moment), with an explanation screen first; "Not now" lets the user enable it later in Settings |
| Technical | Data lost if the app is deleted (on-device only) | Accept for MVP and state it clearly; sync arrives in Phase 3 |
| Technical | Custom plant illustrations and animations take longer than expected | Start with simple drawn stages; polish animations after the core loop works |
| Time | Scope creep from the many ideas we deferred | §5.3 Out of Scope list is the contract; new ideas go to Phase 2/3 |

## 8. Feedback Loops

### 8.1 Stakeholders Feedback

- **Key Stakeholders:** project owner (PM and primary user); 10 to 20 student testers; portfolio reviewers.
- **Tracks and documents feedback:** a simple feedback log (form or sheet) after week 1 and week 4 of testing, plus short interviews with 3 to 5 testers.
- **Prioritizes feedback:** what blocks the core loop (plant, water, bloom) first, then retention issues, then nice-to-haves (go to Phase 2/3).

### 8.2 A/B Testing

> ⚠️ TBD — Not planned for the MVP (tester group is too small). Candidate later test: reminder at a user-chosen time vs. a default evening time, measuring Day-7 retention.

### 8.3 Before/After Data

Before testing, ask testers how they capture thoughts today and how many they think they lose per week. After 4 weeks, compare their self-reported lost thoughts and feeling of progress against in-app activity (plants, waters, blooms).

## 9. Product Requirements

1. **Onboarding (first open only):** Welcome screen; "Who are you?" (4 options); bed setup showing suggested beds for that persona (rename, add, remove; colors auto-assigned); guided first plant with a seed-to-seedling animation; daily reminder screen (Morning 8:00 / Evening 9:00 / custom time / Not now), which triggers the iOS permission prompt only on "Yes".
2. **Beds:** user-created, each with a name and color. A permanent 💡 **Ideas** bed is the default for unsorted thoughts. Beds can be renamed, recolored, reordered (drag), folded, and deleted (plants in a deleted bed move to Ideas).
3. **Plant (thought):** text (required), bed (defaults to Ideas), priority High ▲▲ / Medium ▲ / Low – (optional; none is treated as lowest), created date, watering log (one date-stamped entry per watering), bloomed date.
4. **Plant stages:** seed (0 waters), watered (1), growing (2+), bloom (marked done). Small tasks can bloom straight from seed.
5. **Ordering inside a bed:** priority (High, then Medium, then Low/none), then newest first. Bloomed plants leave the bed and appear under "🌸 Bloomed today" for that day.
6. **Garden calendar:** month view. Each day's state comes from that day's activity: empty (nothing), planted only, some watered, bloomed. Tapping a day lists that day's Bloomed, Watered, and Planted items with bed colors. The weekly strip shows blooms and waters this week.
7. **Greeting:** based on the device's local time (morning, afternoon, evening, night). No network or API.
8. **Daily reminder:** one local notification per day at the chosen time, skipped if the app was already opened that day; rotating gentle copy; editable in Settings.
9. **Data:** stored on the device; no account. Works fully offline.

## 10. UI/UX Requirements

- **Visual style:** warm cream paper background; large bold screen titles; generous white space; chunky rounded cards with colored offset shadows; floating pill tab bar **(🌰 Plant | 🌳 Garden)** with Settings in the header.
- **Beds:** raised planter boxes in soft pastel bed colors with a soil strip at the bottom; header shows bed name and plant count; plants stand on the soil with wooden-stake labels showing the text and the ▲ priority marker; horizontal scroll when the bed overflows.
- **Plant illustrations:** custom drawn stages (seed mound, small shoot, taller stem, flower in the bed's color). Our own art, not copied from any reference app.
- **Primary action:** "PLANT IT" button with spinning circular text, bottom right; opens the planting sheet with the keyboard already focused.
- **Feedback:** a small grow animation on water; a bloom animation on done.
- **States to design:** empty bed ("empty soil · plant here"), empty garden (first run), Garden day with no activity, notification permission denied, very long thought text (truncate on stake, full text in detail).
- **Tone:** friendly, never guilt-inducing. No streak counters, no "you missed" language.
