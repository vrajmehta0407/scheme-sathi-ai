# Scheme Sathi AI: Team Prompt (no-code version, no API keys)

Paste this into Claude, fill the [brackets], send.

---

You are my AI app team. I can't code. Build me a complete, working app called Scheme Sathi AI that I can run locally with one command. IMPORTANT: use NO API keys, NO paid services, NO cloud AI and NO external CDNs. Everything must run on my computer and work offline after the first load.

MY APP IDEA: Scheme Sathi AI helps Indian citizens find the government welfare schemes they qualify for. They answer a few simple questions, and the app shows matching schemes with plain reasons, what documents they need, how to apply, and how much money they could get. It also has dashboards and a data-analysis workbench.
WHO IT'S FOR: Farmers, students, women, senior citizens, workers, NGOs and analysts. [optional: add your state, e.g. Gujarat]

TECH STACK (use exactly this):
- Frontend: Next.js 15 (App Router) + TypeScript + Tailwind CSS + Framer Motion + GSAP + Lenis
- Charts and map: Recharts + visx + d3-geo with a bundled India map file (no map tiles)
- Data: SQLite (local file) with Drizzle ORM; Fuse.js for search; TanStack Table for data tables
- Languages: English, Hindi, Gujarati (next-intl, self-hosted fonts)
- Eligibility, explanations and insights come from a local rules engine and text templates, NOT from an AI service
- Offline: PWA with service worker

Work as a team of four, in this exact order. Show each role's work under its own heading.

1. PLANNER
- Research the idea first: who will use it, what existing scheme-finder portals do well and badly, and the 5-7 must-have features. Cut anything not essential for version 1.
- Break the app into screens: Landing, Language + Wizard, Scheme Board, Scheme Detail, Compare, What-if Simulator, Document Wallet, Application Tracker, Citizen Dashboard, Analytics Workbench (Overview, Map, Funnel, Blockers, Cohorts, Overlap), Admin Console, Settings/Privacy. For each screen, list what is on it and what every button does.
- Define the folder structure, database tables and the eligibility rule format.
- If something critical is unclear, ask me up to 3 quick questions. Otherwise make sensible assumptions and list them.

2. DESIGNER
- Light theme only, NO dark mode. Colourful, glassy, Pinterest-style masonry with an animated jaali (lattice) background. It must look like a real 2026 product, not a template.
- Use exactly THREE colours: two main colours, Civic Blue #1479FF and Sunbeam Yellow #FFC20E, plus one different accent, Parrot Green #12B76A (for Eligible and success only, used sparingly). Neutrals: Midnight Navy #0A1A3C, White, Sky Mist #F0F6FF.
- Do NOT use violet, lime, orange/tangerine, teal or pink (those belong to my other projects). No cream, no beige, no red.
- Yellow is never used for text. Dark navy text goes on yellow.
- Animations: staggered reveals, cards that reshuffle smoothly when filters change, count-up numbers, charts that draw on, tilt-on-hover, scroll-pinned landing story, scheme-name marquee in 3 languages, confetti in brand colours.
- Fonts: Sora or Outfit (headings), Manrope (body), IBM Plex Mono (numbers), Noto Sans Devanagari and Gujarati.
- Mobile-first, big tap targets, high contrast, reduced-motion support.

3. BUILDER
- Build the full project stage by stage: scaffold and setup script, scheme data, rules engine, landing page, wizard, scheme board, scheme detail with "Why?", what-if simulator, document wallet and tracker, citizen dashboard, analytics workbench, admin console, privacy settings.
- Create about 40 sample schemes (central plus a few Gujarat ones) with English, Hindi and Gujarati text, rules, documents, steps and official links. Mark ALL scheme data as "SAMPLE, verify on the official portal before applying".
- Create a seeded synthetic population of about 20,000 households for the analytics, and label it "Synthetic data" everywhere it is shown.
- Every screen and button from the Planner's list must actually work.
- Missing answers must show "Likely", never "Eligible". Never promise guaranteed eligibility.
- No placeholders, no "TODO", no "add your code here".

4. TESTER
- Use the app like a real user. Test every button, form and screen, including edge cases: income exactly at the limit, age one day under the limit, skipped questions, all questions skipped, switching language mid-way, no internet, 20,000-row tables, double clicks, going back.
- Check the rules engine with at least 30 hand-verifiable cases and confirm that unknown answers never become "Eligible".
- Check that analytics totals add up (states sum to the national total) and that small groups are hidden.
- Confirm there are no external network requests and no API keys anywhere in the code.
- List every bug found. The Builder then fixes them.
- Repeat test, then fix, until nothing breaks.

FINALLY
- Give me all the final code file by file, with the full folder structure.
- Write a README with the exact commands to run (setup, start) and how to add or edit a scheme.
- Tell me in 3 simple steps how to open and use the app.
- Suggest 3 features for version 2.
