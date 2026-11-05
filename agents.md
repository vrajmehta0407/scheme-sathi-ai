# SchemeSathi AI — Agent Roles & Workflow (Combined)
This file defines the AI-assisted engineering workflow for Antigravity. Agents are collaborators with scoped responsibilities; they must not invent scheme data or bypass source review.

## 1. Orchestrator / Product Lead
**Owns:** scope, task sequencing, integration, acceptance criteria.
- Read PRD, design, and architecture before coding.
- Break work into vertical milestones.
- Keep MVP scope tight; track blockers.
- Require evidence (tests, screenshots, working flows) before marking tasks done.
- Do not declare completion if build, tests, or core paths fail.

## 2. UX/UI Design Agent
**Owns:** visual language, information hierarchy, responsive interaction.
- Follow `design.md` exactly as direction, while improving craft.
- Build light, colorful, editorial/Pinterest-inspired interface with subtle glass and polished animation.
- Avoid dark theme, generic AI dashboard, overuse of gradients, emoji-only iconography.
- Check mobile, tablet, desktop, keyboard, reduced-motion, Gujarati text rendering.
- Deliver component states: default, hover, focus, loading, empty, error, disabled.

## 3. Frontend Agent
**Owns:** Next.js application and user-facing flows.
- Implement landing, profile intake, results, scheme details, Ask AI, saved, and admin review screens.
- Use TypeScript; typed API contracts; accessible semantic controls.
- Use reusable components and design tokens.
- Integrate API with loading/error/empty states.
- Do not hardcode invented official scheme claims. Demo fixtures must be visibly labeled.
- Implement animations with reduced-motion fallback.

## 4. Backend / API Agent
**Owns:** FastAPI, data models, API contracts, authorization.
- Implement versioned endpoints described in architecture.
- Use Pydantic validation and consistent error formats.
- Apply pagination, rate limiting, safe logging, and RBAC for admin.
- Keep user profile processing ephemeral unless consent is given.
- Write unit/integration tests.

## 5. Eligibility & Data Agent
**Owns:** normalized scheme schema, deterministic matching, source provenance.
- Represent criteria as explicit typed rules.
- Unknown profile data must result in unknown, never inferred.
- Hard exclusion rules must be respected.
- Every published record needs source URL, source organization, review state, and verification date.
- No fabricated official records, benefits, deadlines, documents, or application URLs.
- Create demo data only with explicit DEMO labels.

## 6. RAG / AI Agent
**Owns:** retrieval, grounded response orchestration, citations.
- Retrieve only approved source records.
- Send exact excerpts and IDs to the model.
- Require structured response with citation IDs.
- Validate all citations and unsupported factual claims.
- Explain uncertainty in plain language.
- AI must never override deterministic eligibility outcomes or imply guaranteed approval.

## 7. QA / Accessibility Agent
**Owns:** test strategy and release gate.
- Unit-test eligibility operators, bounds, unknown handling, geographic scope.
- Test API validation, citation validation, permissions, and privacy redaction.
- E2E-test the user journey: landing -> profile -> matches -> detail -> official source.
- Test English and Gujarati layout, responsive widths, keyboard access, reduced motion, contrast.
- Report reproducible defects; block release on critical issues.

## 8. Security & Privacy Agent
**Owns:** threat model and privacy controls.
- Ensure no Aadhaar, OTP, passwords, bank PINs, or sensitive credentials are requested.
- Inspect prompt injection, XSS, CSRF, SSRF, unsafe URL handling, auth and secret management.
- Verify user data is not written to logs or analytics.
- Admin content publishing requires authorization and audit trail.
- Flag unsafe or misleading language.

## 9. Agent handoff protocol
Every agent task must include:
- Objective and files to touch.
- Relevant requirement IDs.
- Constraints / assumptions.
- Deliverables.
- Tests or validation evidence.
- Known gaps and handoff notes.

## 10. Suggested milestone sequence
1. Repository scaffold, shared types, design tokens, lint/test baseline.
2. Frontend shell and landing page with visual polish.
3. Guided profile and client-side flow.
4. Scheme catalog schema, demo fixtures clearly marked.
5. Eligibility engine and tests.
6. Search, results, details, and source presentation.
7. RAG assistant and citation validator.
8. Admin review workflow and permissions.
9. Localization, accessibility, security hardening.
10. End-to-end tests, README, environment setup, final quality review.

## 11. Definition of done
- Relevant requirements implemented.
- No broken routes or console errors in core flows.
- Lint, typecheck, tests, and production build pass.
- Source and demo status are transparent.
- Responsive and accessibility checks completed.
- README includes setup, environment, run/test commands, architecture summary, and known limitations.
