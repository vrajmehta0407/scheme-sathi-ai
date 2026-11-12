# Scheme Sathi AI: Agents (agents.md)

**No API keys, no cloud AI.** In Scheme Sathi, an "agent" is a local, deterministic engine with a clear job, inputs, outputs and tests. Plain-language text is produced from templates over computed facts, so every sentence is traceable and works offline. (An optional on-device model can be added later behind a feature flag, off by default.)

## 0. Orchestrator
- **Role:** Coordinates the engines for each user event (answer given, what-if changed, document ticked, filter changed, admin edit).
- **Behaviour:** runs independent engines in parallel, debounces rapid changes, caches results by input hash, and surfaces errors as friendly messages.

## 1. Profile Agent
- **Goal:** Collect and normalise the citizen profile.
- **Inputs:** wizard answers. **Outputs:** validated profile object (Zod schema) with `known` and `unknown` fields.
- **Rules:** income bands convert to midpoints and ranges; missing fields stay `unknown` (never guessed); derives fields (age group, senior flag, BPL-like flags only if the user states them).
- **Next-question logic:** picks the next question that would split the most remaining candidate schemes (information gain), so users answer the fewest questions.

## 2. Eligibility Agent (Rules Engine)
- **Goal:** Decide Eligible / Likely / Not eligible for every scheme.
- **Method:** evaluates each scheme's JSON rule tree against the profile (see architecture.md); unknown fields produce "Likely".
- **Output per scheme:**
```json
{
  "scheme_id": "sample-farmer-income-support",
  "status": "likely",
  "criteria": [
    {"field":"occupation","passed":true},
    {"field":"land_hectares","passed":null,"hint":"Add your land size to confirm"}
  ],
  "near_miss": null,
  "confidence": 0.8
}
```
- **Guardrails:** never says "guaranteed"; always includes "verify on the official portal"; unknown is never treated as pass.

## 3. Near-Miss and What-if Agent
- **Goal:** Show how close a citizen is and what would change the result.
- **Method:** for "Not eligible" schemes with exactly one failed criterion, compute the distance (e.g. income over cap by Rs. 20,000, age short by 8 months). The what-if mode re-runs the Eligibility Agent on modified copies of the profile and diffs the outputs.
- **Output:** "gained" and "lost" scheme lists with the criterion that changed.
- **Guardrail:** what-if results are labelled as hypothetical.

## 4. Recommender Agent
- **Goal:** Order the matched schemes sensibly.
- **Score:** `0.35*benefit_value + 0.25*ease(documents held) + 0.20*deadline_urgency + 0.10*level_fit + 0.10*popularity_prior`
- **Also:** flags schemes that cannot be combined (mutually exclusive) and groups stackable ones into a "benefit bundle".

## 5. Explainer Agent (template language engine)
- **Goal:** Produce clear sentences in English, Hindi or Gujarati.
- **Method:** ICU-style message templates plus the computed facts, e.g. "You are eligible because your annual income is below Rs. {cap} and you are a {occupation}." Each criterion has a reusable phrase in each language.
- **Guardrails:** only states facts present in the rule results; unknown translations fall back to English with a marker; reading level kept simple.

## 6. Benefit Calculator Agent
- **Goal:** Estimate money value.
- **Method:** per-scheme formula types: `fixed_per_year`, `fixed_per_month`, `one_time`, `percent_of_cost` (with cap), `slab`. Sums yearly and lifetime totals for the selected bundle, avoiding double counting.
- **Guardrail:** shows the formula inputs, labels results "estimate".

## 7. Document Agent
- **Goal:** Build the shortest path to being application-ready.
- **Method:** unions required documents across chosen schemes, dedupes, orders by how many schemes need each, shows readiness percent, and suggests the next best document to obtain ("Getting an income certificate unlocks 4 more schemes").
- **Output:** checklist, printable PDF, per-document "where to get it" hints.

## 8. Application Tracker Agent
- **Goal:** Keep applications on track.
- **Method:** state machine (not started, documents ready, applied, approved, rejected) with allowed transitions; computes reminder dates from deadlines; in-app notifications only (no external sends).
- **Insights:** applications stuck over 30 days, schemes with deadlines inside 14 days.

## 9. Analytics Agent
- **Goal:** Turn the synthetic population and catalogue into decisions.
- **Computes:**
  | Analysis | Description |
  |---|---|
  | Eligibility rate | Share of households eligible per scheme, by state, category, occupation, income band |
  | Coverage gap | Eligible but without required documents, mapped by state |
  | Top blockers | Criteria that fail most often across near-eligible households |
  | Unclaimed benefit | Estimated Rs. by region and group if all eligible households claimed |
  | Cohort comparison | Group A vs group B differences with simple significance (two-proportion z-test) |
  | Overlap matrix | Pairwise co-eligibility between schemes |
  | Funnel | Profile, eligible, documents ready, applied, approved (simulated rates, labelled) |
- **Guardrails:** always shows sample size; hides cells with fewer than 30 households; labels "Synthetic data"; no causal claims.

## 10. Insight Writer Agent (templates)
- **Goal:** Create the one-line "insight pins" on dashboards.
- **Method:** rank statistics by effect size and rarity, then fill templates such as "{group} in {state} are {x} points less likely to have documents ready than the national average."
- **Guardrail:** every sentence links back to the underlying chart and numbers.

## 11. Admin Quality Agent
- **Goal:** Keep catalogue data healthy.
- **Checks:** every scheme has rules, documents, steps, source URL and `last_verified` within 180 days; rule trees are satisfiable (no contradictory criteria); translations present; duplicate detection (fuzzy name match); regression test run on edits against golden profiles.
- **Output:** validation report shown in the Admin Console, blocks publishing on errors.

## Shared Rules
1. No external network calls, no API keys, ever.
2. Every statement shown to a citizen is traceable to a rule result, calculator output or catalogue field.
3. Unknown is not "yes": uncertainty is displayed as "Likely".
4. Sample and synthetic data are always labelled.
5. Every engine is a pure function with unit tests and golden cases.
6. Performance budgets: rules under 5 ms for the full catalogue, analytics queries under 500 ms with cache.

## Agent Interaction Map
```
Wizard answer -> Profile Agent -> Eligibility Agent -> Recommender -> Board
                                       |-> Near-Miss / What-if
                                       |-> Explainer ("Why?")
                    Selected schemes -> Benefit Calculator, Document Agent -> Tracker
Filters -> Analytics Agent -> Insight Writer -> Dashboard pins
Admin edits -> Admin Quality Agent -> (pass) -> publish new catalogue version
```
