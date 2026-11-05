# SchemeSathi AI — Product Requirements Document
**Version:** 1.0 | **Product:** Generative AI Government Scheme Eligibility Assistant | **Primary market:** India

## 1. Product vision
SchemeSathi AI helps people discover relevant Indian central and state government schemes, understand eligibility in plain language, prepare a checklist of required documents, and navigate to official application sources. It should feel like a trustworthy, approachable public-service guide—not a generic chatbot.

## 2. Problem
Citizens often struggle to:
- Find schemes spread across ministries, state portals, and official notices.
- Understand eligibility criteria written in bureaucratic language.
- Know which documents and application steps are needed.
- Distinguish verified official information from rumors, outdated pages, or AI-generated guesses.
- Discover schemes relevant to their household, occupation, location, or life stage.

## 3. Goals and non-goals
### Goals
1. Deliver a guided eligibility discovery experience using user-provided profile details.
2. Explain match results with criterion-by-criterion reasoning and source citations.
3. Provide scheme summaries, benefit details, required documents, deadlines where verified, and official application links.
4. Support multilingual, accessible, mobile-first use, prioritizing English and Gujarati initially; design for Hindi expansion.
5. Maintain visible source freshness and confidence indicators.
6. Protect personal data and minimize collection.

### Non-goals for MVP
- Submitting applications on behalf of citizens.
- Guaranteeing approval, benefit receipt, or eligibility.
- Collecting Aadhaar numbers, bank credentials, OTPs, or other highly sensitive identifiers.
- Replacing government portals, legal advice, or official scheme authorities.
- Presenting fabricated schemes, deadlines, benefits, or links.

## 4. Target users and jobs-to-be-done
- **Citizen / household:** “Help me find schemes that may fit my situation and understand what to do next.”
- **Student:** “Find scholarships and education assistance for my course, location, and household context.”
- **Farmer / worker / self-employed person:** “Discover assistance applicable to my occupation and explain the conditions.”
- **Community facilitator:** “Help someone navigate scheme information using clear steps and official references.”
- **Content administrator:** “Review source records, freshness, and scheme information before publication.”

## 5. MVP scope
### User-facing
- Landing page with clear CTA: “Find schemes for me.”
- Guided profile flow with optional fields:
  - State / district
  - Age band (not exact DOB)
  - Occupation / student status
  - Household income range
  - Social category only if needed for a scheme; optional and handled carefully
  - Disability status, farmer status, marital / family context only when relevant and optional
  - Education level / course
  - Existing scheme participation (optional)
- Scheme discovery results with match labels: Strong potential match / Possible match / More information needed.
- Scheme details: overview, benefit, eligibility, exclusions, documents, how-to-apply steps, official link, source and “last verified” timestamp.
- Conversational assistant for clarification and plain-language explanations.
- Bookmark / compare schemes in session (MVP can use local client state).
- Language selector (English / ગુજરાતી).
- Feedback: “Was this helpful?” and report outdated information.
- Disclaimer and privacy notice.

### Admin / content operations (MVP-lite)
- Internal scheme data schema and source review workflow.
- Draft / reviewed / published statuses.
- Source URL, source organization, retrieval date, verification date, reviewer, validity notes.
- Seed sample content only when clearly labeled as demo; no fabricated official claims.

## 6. Functional requirements
**FR-01 Profile intake:** Ask one clear question per step; allow skip where optional; explain why a field is requested.
**FR-02 Eligibility matching:** Evaluate explicit rules against profile values. Unknown values must remain “unknown,” not silently pass.
**FR-03 Match explanation:** Show matched, unmet, and unknown criteria in human-readable language.
**FR-04 Retrieval-grounded answers:** The assistant answers scheme questions from approved scheme records and source material.
**FR-05 Citations:** Each factual scheme claim links to an official source record. If no reliable source is available, state that verification is unavailable.
**FR-06 Scheme detail:** Render benefits, eligibility, documents, steps, official application destination, and update metadata.
**FR-07 Search/filter:** Search by scheme name, keyword, state, category, occupation, and benefit type.
**FR-08 Language:** Provide UI localization and generated explanations in selected language; preserve official scheme names.
**FR-09 Privacy:** Avoid unnecessary PII; allow profile reset; do not log sensitive profile values in analytics.
**FR-10 Safety:** Never request Aadhaar/OTP/password/bank PIN; warn users to use official portals and beware of fees/scams.
**FR-11 Feedback:** Capture helpfulness and outdated-content reports without exposing profile data.
**FR-12 Responsive design:** Support phone, tablet, and desktop.

## 7. Eligibility semantics
- Use rule-based matching for structured criteria; LLMs may translate/explain, but must not invent or override rules.
- “Potentially eligible” is not an official determination.
- Every result must show: criteria matched, criteria not met (if known), missing details, source, verification date.
- A scheme with stale or incomplete source data should be marked “Needs verification.”
- Age/income thresholds must be represented as explicit inclusive/exclusive bounds and units.
- State-specific rules must be scoped to the appropriate state / district.

## 8. UX and content principles
- Trust before cleverness: sources are prominent, not buried.
- Plain language, friendly microcopy, no shame or assumptions.
- Show progress during profile intake.
- Avoid “You are eligible” wording; use “You may qualify” or “Potential match.”
- Use visual cards, editorial collage / Pinterest-inspired composition, colorful light palette, subtle glass effects, meaningful motion.
- Motion must respect reduced-motion settings and never block tasks.

## 9. Success metrics
- Profile flow completion rate.
- Search-to-scheme-detail click-through.
- Citation / official-link click-through.
- Helpful response feedback.
- Percentage of answers grounded in approved source records.
- Outdated-data reports and correction turnaround.
- Accessibility audit completion.
- Do not optimize for number of schemes surfaced at the cost of precision.

## 10. Risks and mitigations
| Risk | Mitigation |
|---|---|
| Outdated or incorrect scheme rules | Source metadata, review dates, stale flags, admin review |
| Hallucinated eligibility | Rule engine + retrieval grounding + structured response validation |
| Sensitive profile leakage | Data minimization, no sensitive logs, short retention, user reset |
| Scam / impersonation concern | Official links, source badges, anti-fraud guidance |
| Language translation error | Preserve official wording; human-review critical translated content |
| User mistakes AI for authority | Repeated plain disclaimer and official-source handoff |

## 11. MVP acceptance criteria
- A user can complete or skip the guided profile and receive relevant scheme cards.
- Each displayed scheme has a source URL and verification metadata or is clearly marked demo/unverified.
- Eligibility output includes match reasoning and unknown criteria.
- Assistant refuses to invent missing benefit amounts, deadlines, or application URLs.
- Scheme detail page includes official application link, source, required documents, and disclaimer.
- English and Gujarati UI language selection works for core screens.
- Layout passes keyboard navigation and basic WCAG AA contrast checks.
- Profile reset clears client-held profile data.
