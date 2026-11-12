# Scheme Sathi AI — योजना साथी AI · યોજના સાથી AI

A local-first, offline-capable web application that helps Indian citizens discover welfare schemes they may qualify for, inspect transparent eligibility reasoning, organize required documents, track applications, simulate "What-If" life changes, and explore synthetic policy analytics — **with zero API keys, zero cloud AI calls, and 100% deterministic local engines**.

> **Important Sample & Synthetic Data Notice:** All bundled schemes in `data/schemes.sample.json` and `data/rules.sample.json` are **SAMPLE prototype data** (`is_sample: true`) intended for demonstration and local testing. Always **verify exact eligibility, benefits, and deadlines on the official portal** before applying. All population metrics on the Analytics dashboard come from **20,000 locally seeded synthetic households** (`is_synthetic: true`), not real citizen records.

---

## Quick Start

**Requirements:** Node.js 22+ (uses built-in `node:sqlite`), npm 10+.

```bash
# 1. Install workspace dependencies
npm install

# 2. One-command setup: generates AUTH_SECRET, creates SQLite DB, seeds 54 sample schemes,
#    16 canonical documents, and 20,000 synthetic households, then runs Admin Quality checks
npm run setup

# 3. Start the local app (http://localhost:3000)
npm run dev
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run setup` | Generates `apps/web/.env.local`, initializes `db/schemesathi.db`, seeds schemes + population, validates rules |
| `npm run dev` | Starts Next.js development server on port 3000 |
| `npm run build` | Builds the production Next.js bundle |
| `npm run start` | Runs the built production server on port 3000 |
| `npm run typecheck` | Runs TypeScript checks (`tsc --noEmit`) |
| `npm test` | Runs Vitest unit, golden (162 assertions), property, benefit, and analytics reconciliation tests |
| `npm run test:e2e` | Runs Playwright end-to-end tests |
| `npm run seed:schemes` | Re-seeds `data/schemes.sample.json`, `data/rules.sample.json`, and `data/documents.json` |
| `npm run seed:population` | Re-generates 20,000 synthetic households in `db/schemesathi.db` |
| `npm run validate:rules` | Runs the deterministic Admin Quality Agent checks across all rule trees and metadata |

---

## Architecture & Offline Design

- **Zero Cloud AI / Zero External Network Calls:** Enforced by Next.js Content-Security-Policy (`default-src 'self'`) in `apps/web/next.config.ts`. All fonts (`Sora`, `Manrope`, `IBM Plex Mono`, `Noto Sans Devanagari`, `Noto Sans Gujarati`) and the India state TopoJSON (`apps/web/public/india-topo.json`) are bundled locally.
- **11 Local Deterministic Engines (`apps/web/lib/`):**
  - `profile/index.ts` — Zod validation, income-band interval normalization, next-best question selection
  - `rules/index.ts` — Tri-state JSON rule tree evaluator (`all`/`any`/`none`), near-miss distance & What-If simulator, rule-tree trace debugger
  - `benefits/index.ts` — 5 deterministic benefit formulas, mutual-exclusivity & optimal bundle solver, What-If sensitivity cliffs, Household Matrix
  - `recommender/index.ts` — Composite scoring (`benefit`, `ease`, `urgency`, `level`, `popularity`)
  - `explain/index.ts` — Trilingual EN/HI/GU template explanation engine & offline jargon glossary
  - `documents/index.ts` — Union/dedupe checklist builder, "next best document" unlock ranker, readiness %, time-to-apply estimator, renewal tracker & `.ics` generator
  - `tracker/index.ts` — Application state machine + 14-day deadline & 30-day stale reminders
  - `analytics/index.ts` — Synthetic cohort analytics (`n < 30` small-cell suppression), two-proportion z-test, Lorenz/Gini disparity, Insight Writer pins
  - `admin/index.ts` — Satisfiability, stale-date (>180 days), translation, and fuzzy duplicate validator
  - `orchestrator/index.ts` — Coordinates profile, eligibility, recommender, explainer, benefits, and documents with cache
- **Trilingual UI (EN / HI / GU):** Instant language switching via `apps/web/messages/{en,hi,gu}.json`.
- **Three-Colour Civic Glass Design System:** Built strictly around Civic Blue (`#1479FF`), Sunbeam Yellow (`#FFC20E`), and Parrot Green (`#12B76A`) on Frost White (`#FFFFFF`) / Sky Mist (`#F0F6FF`) with Midnight Navy (`#0A1A3C`) ink.

---

## 50+ Integrated Citizen, Financial, Analytics & Admin Features

1. **Offline Voice-Assisted Wizard Input** — Local Web Speech API dictation (`en-IN`, `hi-IN`, `gu-IN`) in `/wizard`.
2. **Offline Profile Snapshot Token (`SATHI1:...`)** — Portable Base64 profile export/import string in `/wizard`.
3. **CSC / Volunteer Multi-Citizen Kiosk Mode** — Rapid citizen profile queue switcher (`VLE` counter workflow) in the header & `/wizard`.
4. **1-Tap Life-Event Quick Bundles** — Instant preset starter profiles on `/`.
5. **Mutual-Exclusivity & Optimal Benefit Bundle Solver** — Automatically skips conflicting schemes and computes the maximum annual ₹ stack.
6. **Document Expiry & Renewal Tracker + `.ics` Export** — Tracks expiring certificates and generates offline `.ics` calendar reminders.
7. **Offline Jargon Glossary Drawer + Search Filter** — Instant searchable EN/HI/GU definitions for BPL, EWS, SECC, AAY, OBC-NCL, and NPCI seeding.
8. **Family Benefit Planner (Household Matrix)** — Deduplicates per-family schemes vs per-person schemes across saved profiles on `/dashboard`.
9. **Client-Side Printable Citizen Dossier PDF** — Multi-page PDF packet generated 100% offline using `pdf-lib` on `/documents`.
10. **What-If Sensitivity Curves ("Eligibility Cliffs")** — Plots eligible & likely scheme counts across income, age, and land thresholds on `/what-if`.
11. **Time-to-Apply Readiness Estimator** — Calculates `daysToReady` from missing document turnaround days.
12. **AES-256-GCM Password-Protected Local Backup** — Client-side Web Crypto PBKDF2 + AES-GCM encrypted `.json` backup/restore on `/settings`.
13. **Analytics Custom Cohort Builder & Saved Views** — Compare Cohort A vs Cohort B with two-proportion z-test (`z`, `p`, 95% significance) and SQLite saved views.
14. **Rural / Semi-Urban / Urban Disparity & Lorenz/Gini Inspector** — Quantifies synthetic benefit distribution inequality across district tiers on `/analytics`.
15. **Guided Rule-Tree Debugger Sandbox** — Node-by-node `ALL`/`ANY`/`NONE`/leaf tri-state inspector inside `/admin`.
16. **Local Browser Text-to-Speech ("Listen Aloud")** — Reads scheme eligibility & summary in `en-IN`, `hi-IN`, or `gu-IN` on `/schemes/[slug]`.
17. **Multi-Sort Explorer** — Sort schemes by Best Recommender Score, Highest Benefit ₹, Fewest Missing Docs, Fastest Ready Days, or Earliest Deadline.
18. **Offline Grievance / RTI Sec 6(1) / Follow-Up Letter Composer** — Generates EN/HI/GU template letters with 1-click copy & `.txt` download on `/schemes/[slug]`.
19. **Smart Hinglish & Gujarati Phonetic Search** — Expands terms like `kisan`, `vidhwa`, `chhatravritti`, `awas`, `bima`, `rozgar` via `expandSmartQuery`.
20. **Offline QR-Style Citizen Benefit Pass** — Deterministic SVG matrix & printable Citizen Pass card on `/dashboard`.
21. **Deadline Urgency & Countdown Badges** — Flags `Closing in Xd`, `≤45d`, and `Rolling / Open` cycles on Scheme Pins.
22. **Quick Zero-Missing-Docs & Closing-Soon Filter Chips** — 1-tap eligibility & document readiness filters on `/schemes`.
23. **1-Step "Unlock Next Scheme" Gap Roadmap** — Ranks single-gap / single-unknown schemes by potential annual ₹ gain on `/dashboard`.
24. **Printable 1-Page Official Portal Prep Sheet** — Print trigger on `/schemes/[slug]`.
25. **Bookmarked Schemes Quick-Copy Summary** — Copy bookmarked scheme bundle list in 1 click on `/schemes`.
26. **5-Year Nominal vs Inflation-Adjusted Benefit Projection** — Interactive CPI inflation slider & bar chart on `/dashboard`.
27. **Student Net Education Cost & Scholarship Offset Calculator** — Computes out-of-pocket tuition minus matched scholarships on `/what-if`.
28. **Farmer Input, PM-KISAN & Crop Insurance Subsidy Estimator** — Computes annual farm support by land hectares on `/what-if`.
29. **Senior / Widow Monthly Pension Adequacy Meter** — Measures monthly pension coverage % against household expenses on `/what-if`.
30. **MSME Loan & Interest Subsidy EMI Calculator** — Compares standard vs subsidized EMI and margin grant on `/what-if`.
31. **Non-Cash In-Kind Benefit Equivalent Breakdown** — Summarizes Health Cover, Ration, LPG, and Accident Cover on `/dashboard`.
32. **Income Welfare-Cap Cliff Alert** — Warns which income thresholds drop eligible schemes on `/what-if`.
33. **Document Pre-Flight Verification Checklist** — Per-document rejection prevention checks (NPCI DBT seeding, Tehsildar QR, e-KYC) on `/documents`.
34. **Offline Issuing Office & CSC Directory** — Trilingual EN/HI/GU directory of issuing offices, fees, and turnaround days on `/documents`.
35. **Accessible Large-Text Reading Mode (`Aa Large / Std`)** — Header toggle for comfortable high-legibility typography.
36. **Application Portal Reference Number Tracking** — Persist portal reference IDs alongside application stages on `/documents`.
37. **Batch RFC-4180 CSV Export** — Export filtered schemes on `/schemes` and tracked applications on `/documents`.
38. **Offline Plain-Text SMS / WhatsApp Summary Composer** — Compact EN/HI/GU summary ready to copy for family members on `/dashboard`.
39. **State Readiness Scorecard (Grade A–D)** — Synthesizes state document readiness & eligibility index (with `n < 30` suppression) on `/analytics`.
40. **Blocker Action ROI Intervention Hints** — Actionable policy recommendations for top near-miss criteria on `/analytics`.
41. **Category Inclusion & Unclaimed-per-Household Equity Table** — Breakdown across `General`, `OBC`, `SC`, `ST`, `EWS` on `/analytics`.
42. **Official `.gov.in` / `.nic.in` Domain & EN/HI/GU Completeness Audit** — Live catalogue health counters in `/admin`.
43. **Rule-Tree Complexity & Depth Inspector** — Measures rule depth, leaf count, and negation usage (`inspectRuleComplexity`).
44. **Expanded Multi-Archetype Admin Regression Suite Runner** — Verifies canonical citizen archetypes live inside `/admin`.
45. **One-Click Catalogue Snapshot JSON Export** — Download the full active scheme & rule catalogue from `/admin`.
46. **Clone Active Citizen Profile** — Duplicate a household profile for rapid family/CSC entry on `/settings`.
47. **Local Storage & Cache Diagnostics Cards** — View saved profiles, cached schemes, and tracked apps count on `/settings`.
48. **Print Blank Paper Intake Sheet** — Print an offline intake sheet for rural/camp data collection on `/wizard`.
49. **Side-by-Side Scheme Comparison Matrix** — Compare up to 3 schemes across benefit, readiness, and mutual exclusivity on `/schemes`.
50. **Custom Cohort Z-Test Comparison (`z`, `p`, 95% Significance)** — Statistical significance testing across filtered synthetic cohorts on `/analytics`.
51. **Interactive India State Coverage-Gap Choropleth** — Offline TopoJSON map with state drill-down on `/analytics`.
52. **Virtualised 20,000-Row Synthetic Household Explorer** — Smooth `@tanstack/react-virtual` table on `/analytics`.

---

## How to Add or Edit a Scheme

1. **Via Admin Console (`/admin`):** Open the **Admin Console**, edit an existing scheme or use **+ New Scheme**, test its JSON rule tree live inside the **Guided Rule-Tree Debugger Sandbox**, and click **Publish**. The Admin Quality Agent validates required fields, translations (`en`/`hi`/`gu`), URL, `last_verified` recency, duplicate similarity, and rule-tree satisfiability before persisting to `db/schemesathi.db`.
2. **Via Seed Files:** Add the scheme metadata entry to `data/schemes.sample.json` and matching rule tree (keyed by `scheme_id`) to `data/rules.sample.json`, then run:
   ```bash
   npm run validate:rules
   npm run seed:schemes
   ```
   Re-run `npm test` afterwards to verify golden cases and rule invariants remain green.

