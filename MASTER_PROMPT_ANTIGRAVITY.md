# Antigravity Master Prompt — SchemeSathi AI

You are Antigravity acting as a senior product engineering team. Build **SchemeSathi AI**, a polished, production-minded generative AI government scheme eligibility discovery assistant for India.

## Mandatory context
Before implementation, read and follow:
- `PRD.md`
- `design.md`
- `architecture.md`
- `agents.md`

Treat these as the project source of truth. If there is a conflict, surface it and resolve conservatively. Do not begin with a generic boilerplate UI.

## Product outcome
A citizen can answer a short, optional guided profile questionnaire, discover potentially relevant central/state schemes, inspect eligibility criterion reasoning, read documents and application steps, ask grounded follow-up questions, and continue through official government links. The product must clearly state it is an informational assistant and not an official eligibility decision.

## Visual direction — non-negotiable
Create an unusually polished, colorful, light-theme experience inspired by modern editorial websites, Pinterest-like discovery layouts, and premium motion design:
- Warm ivory canvas, vivid indigo/teal/coral/mango/lavender accents.
- Airy composition, asymmetric card arrangements, large typographic hero, layered paper-like scheme cards, tasteful glassmorphism in selected areas.
- Beautiful custom abstract illustrations / vector shapes, not emoji-only cards.
- Refined hover states, gentle parallax/floating art, staggered reveal, animated progress, smooth transitions, skeleton loading.
- Use motion intentionally; honor `prefers-reduced-motion`.
- Responsive from mobile to desktop; high-quality Gujarati font fallback and wrapping.
- Do NOT use dark theme. Do NOT produce a generic admin dashboard as the primary experience. Do NOT rely on default shadcn styling without substantial art direction. Avoid excessive gradients and over-animation.

## Required user journeys
1. Landing page -> “Find schemes for me.”
2. Guided profile (one clear question at a time, optional fields clearly marked, progress indicator, review/edit).
3. Match results -> filter / search -> view why it may fit.
4. Scheme details -> eligibility breakdown (matched / not met / unknown), benefits, documents, steps, official source and verification date.
5. Ask SchemeSathi chat -> grounded answer with citations and related scheme cards.
6. Save / compare up to three schemes (local storage only if explained as local).
7. English and Gujarati core UI localization.
8. Feedback and outdated information report.
9. Admin content review screen protected by role-based access, with draft/reviewed/published states and audit details.

## Data integrity / AI rules
- Eligibility must be computed by deterministic rule engine; LLM only explains.
- Unknown profile fields must remain unknown. Never make assumptions.
- Use RAG over approved source records only.
- Every factual benefit, eligibility, deadline, or document claim must cite source IDs/URLs.
- Never invent official scheme names, benefit amounts, eligibility rules, deadlines, documents, source URLs, ministry endorsements, or “verified” badges.
- If no verified source is available, explain that and provide a safe path to official search.
- Demo records must be labeled `DEMO — NOT VERIFIED`; never represent demo content as live government information.
- Never ask for Aadhaar number, OTP, password, bank PIN, or credentials.
- Never claim the user is guaranteed eligible or guaranteed to receive a benefit.
- Official links must be clearly labeled and external navigation should be obvious.

## Technical requirements
- Frontend: Next.js App Router, TypeScript, Tailwind, Framer Motion, accessible component primitives customized to the design system.
- API: FastAPI + Pydantic, versioned endpoints.
- DB: PostgreSQL; pgvector optional, not mandatory for local MVP.
- AI provider abstraction with `.env` configuration. No secrets in source.
- Typed API contracts, schema validation, consistent errors, pagination.
- Unit tests for eligibility operators and unknown handling; tests for citation validation.
- Provide `.env.example`, Docker Compose for local DB/services where practical, and a detailed README.
- If credentials are absent, application should still run in demo mode with clearly labeled demo data and graceful AI-disabled fallback.

## Execution instructions
1. Inspect the repository and report its current state briefly.
2. Create a concise implementation plan aligned to the milestone order in `agents.md`.
3. Scaffold the repo and establish lint, typecheck, and test commands.
4. Implement in coherent vertical slices; do not stop after generating a static mockup.
5. Run the app, inspect the actual screens at desktop and mobile sizes, and iteratively improve visual quality.
6. Test all core routes and forms. Resolve runtime errors, broken links, and layout overflow.
7. Run lint, typecheck, unit tests, and production build. Fix issues instead of merely reporting them.
8. Finish with a concise delivery report: features built, stack, commands, test results, environment setup, limitations, and any unverified data.

## Quality bar
The experience should look like a carefully art-directed startup/public-interest product with crisp typography, balanced whitespace, beautiful card composition, meaningful microinteractions, trustworthy content hierarchy, and responsive polish. The working system—not just the screenshots—must be complete for MVP.

Start by reading all four markdown files and then proceed.
