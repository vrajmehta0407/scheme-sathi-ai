# Scheme Sathi AI: Product Requirements Document

**Tagline:** Every scheme you deserve, found in 2 minutes. Eligibility, documents, benefits and analytics, all in one place.
**Version:** 1.0 | **Primary market:** India | **Platform:** Responsive web app (PWA), works offline | **Languages:** English, Hindi, Gujarati

---

## 1. Problem
India has hundreds of central and state welfare schemes (farmers, students, women, senior citizens, workers, entrepreneurs, health, housing), but most citizens never find out which ones they qualify for. Information is scattered across portals, written in complex language, and eligibility rules vary by state, income, age, category and occupation. Result: crores of rupees in benefits go unclaimed.

## 2. Vision
A friendly "Sathi" (companion) that asks a few simple questions, instantly shows every scheme you likely qualify for, tells you exactly which documents to gather and which steps to follow, and turns the data into clear dashboards for citizens, NGOs and analysts.

## 3. Key Principle: No API Keys, Privacy First
- The whole product runs with **zero external API keys and zero paid services**.
- Eligibility, recommendations, explanations and analytics are produced by a **local rules engine, bundled datasets and templates**, not by a cloud AI service.
- A citizen's profile stays on their own device / local database. No tracking, no third-party calls.

## 4. Target Users
| Persona | Need |
|---|---|
| Citizen (Ramesh, 45, small farmer) | Find farm, insurance and pension schemes in his language |
| Student (Anita, 19) | Find scholarships and skill programmes |
| Women entrepreneur (Meena, 32) | Find loans, subsidies and training schemes |
| Senior citizen (Mr. Shah, 68) | Pension, health cover, concessions |
| Volunteer / CSC operator | Help many people quickly, track applications |
| NGO / analyst / policy researcher | Understand coverage gaps and unclaimed benefits by region and group |

## 5. Goals and Success Metrics
- Profile to first matched schemes in **under 90 seconds** (under 10 questions)
- At least **8 relevant schemes** surfaced per typical profile
- Eligibility result agrees with official criteria in **95%+** of curated test cases
- Document checklist completeness above **90%**
- Dashboard loads under **2 s** on 100K-row synthetic dataset
- Week-4 retention above **30%**

## 6. Core Features (MVP)
### F1. Smart Profile Wizard
- Short, friendly steps: state and district, age, gender, income range, occupation, category (General/OBC/SC/ST/EWS), disability, family size, land holding, education, existing documents
- Progress bar, skip-able fields, instant partial results as you answer ("12 schemes found so far")
- Save multiple profiles (family members)

### F2. Scheme Explorer (Pinterest-style board)
- Masonry board of scheme cards with category, benefit amount, deadline, level (Central / State)
- Instant search and filters (category, state, benefit type, level, eligibility status)
- Bookmark, compare up to 3 schemes side by side

### F3. Eligibility Engine
- Three states: **Eligible**, **Likely (need 1 more check)**, **Not eligible**
- "Why?" panel: shows each rule passed or failed in plain words
- **Near-miss insights:** "You miss this scheme by Rs. 20,000 of income" or "Turn 60 in 8 months to unlock this pension"
- What-if simulator: change income, age, land or occupation and watch schemes appear or disappear live

### F4. Document Checklist and Wallet
- Per scheme and combined checklist (Aadhaar, income certificate, caste certificate, bank passbook, land record, etc.)
- Mark documents as "have / need", with where-to-get hints
- Printable PDF checklist

### F5. Step-by-Step Application Guide
- Plain-language steps: where to apply (online/offline), what to carry, typical timeline, official portal link (opens in a new tab; static link list, no API)
- Application tracker: Not started, Documents ready, Applied, Approved, Rejected, with reminders (in-app)

### F6. Benefit Calculator
- Estimated yearly and lifetime benefit per scheme and total "money on the table"
- Stack view: which schemes can be claimed together

### F7. Citizen Dashboard
- Total matched schemes, estimated annual benefit, claimed vs unclaimed, upcoming deadlines, document readiness, application funnel
- Category donut, benefit-by-month timeline, "missed benefits" leaderboard

### F8. Analytics Workbench (data analysis)
- Built on a bundled **synthetic population dataset** (about 20,000 households, clearly labelled synthetic) plus the real scheme catalogue
- Views: eligibility rate by state/category/occupation, scheme coverage gap map (India choropleth), criteria that block the most people (e.g. income cap vs missing documents), unclaimed benefit estimate by region, cohort comparison (e.g. SC women farmers vs all farmers), scheme overlap matrix
- Filters, drill-down, sortable tables, CSV and PNG export, saved views
- Auto-written "insight cards" generated from templates over computed stats (no AI service)

### F9. Admin Console (local)
- Add/edit schemes through a form, edit eligibility rules in a visual rule builder, bulk import via CSV/JSON, validation report, version history

## 7. Post-MVP
Voice input (offline browser speech where available), more languages, WhatsApp-style chat UI, CSC operator multi-citizen mode, real-time data sync with official catalogues, optional on-device small language model (off by default).

## 8. Functional Requirements
| ID | Requirement | Priority |
|---|---|---|
| FR-1 | Guest mode with local profile (no login needed) | P0 |
| FR-2 | Optional local account (email + password) stored in local DB | P1 |
| FR-3 | Profile wizard with live results | P0 |
| FR-4 | Rule-based eligibility with explanations | P0 |
| FR-5 | Near-miss and what-if simulator | P0 |
| FR-6 | Scheme search, filters, compare, bookmark | P0 |
| FR-7 | Document checklist and PDF export | P0 |
| FR-8 | Application tracker with in-app reminders | P1 |
| FR-9 | Benefit calculator | P1 |
| FR-10 | Citizen dashboard | P0 |
| FR-11 | Analytics workbench with filters, exports | P0 |
| FR-12 | Language switcher (EN/HI/GU) | P0 |
| FR-13 | Admin scheme and rule editor | P1 |
| FR-14 | Data export and delete (privacy) | P0 |

## 9. Non-Functional Requirements
- Zero API keys; works fully offline after first load (PWA)
- First load under 2.5 s on 4G; Lighthouse performance above 90
- WCAG 2.2 AA, large touch targets, readable Hindi and Gujarati text
- All personal data stays on the device or local DB; no third-party scripts or analytics
- Scheme data versioned with "last verified" date and source link

## 10. User Flows
**Citizen:** Landing, choose language, answer wizard, see matched board, open a scheme, see why eligible, view checklist, track application, check dashboard.
**Analyst:** Open Analytics, choose filters, explore map and charts, read insight cards, export CSV.
**Admin:** Open Admin, add/edit scheme and rules, run validation, publish new version.

## 11. Screens
Landing, Language + Wizard, Matched Schemes Board, Scheme Detail, Compare, What-if Simulator, Document Wallet, Application Tracker, Citizen Dashboard, Analytics Workbench (Overview, Map, Funnel, Cohorts, Overlap), Admin Console, Settings/Privacy.

## 12. Data Notes (important)
- The bundled scheme catalogue (about 40 schemes: central plus a few Gujarat state ones) is **SAMPLE data** assembled for the prototype. Every scheme shows a "last verified" date and an official source link. **Users must verify with the official portal before applying.** Admins can update data from the console.
- The population dataset is **synthetic**, generated by a seeded script; it is not real citizen data and the app labels it clearly.

## 13. Risks
| Risk | Mitigation |
|---|---|
| Outdated or wrong scheme rules | "Last verified" dates, source links, disclaimers, admin editor, validation tests |
| Over-promising eligibility | Three-state result, "Likely" status, "verify officially" notice |
| Low literacy / language | Simple wording, icons, EN/HI/GU, large buttons |
| Misreading synthetic data as real | Persistent "Synthetic data" badge on analytics |
| Sensitive data | Local-only storage, delete anytime |

## 14. Milestones
- **Week 1:** Scaffold, scheme schema + dataset, rule engine, wizard
- **Week 2:** Explorer board, eligibility explanations, near-miss, what-if
- **Week 3:** Checklist, tracker, benefit calculator, citizen dashboard
- **Week 4:** Analytics workbench, admin console, i18n, polish, PWA

## 15. Out of Scope (v1)
Submitting applications on government portals, Aadhaar or DigiLocker integration, real citizen data, payments.
