# SchemeSathi AI — Design System & UX Direction
**Direction:** Colorful editorial discovery, Pinterest-inspired cards, premium motion, light theme only.

## 1. Visual concept
A “public-service discovery journal”: an airy, optimistic interface with layered paper-like cards, soft translucent glass panels, warm backgrounds, vivid category colors, and tasteful motion. Avoid generic AI dashboard tropes, dark mode, neon cyber styling, and excessive gradients.

## 2. Palette (design tokens)
- Canvas: `#FFF9F1` warm ivory
- Surface: `#FFFFFF`
- Ink: `#243047` deep slate
- Muted text: `#687386`
- Primary: `#5B5FEF` indigo-violet
- Secondary: `#16A085` teal
- Accent coral: `#FF806E`
- Accent mango: `#FFC857`
- Accent sky: `#8CCBFF`
- Accent lavender: `#C7B8FF`
- Border: `rgba(36,48,71,0.10)`
- Glass: `rgba(255,255,255,0.68)` with backdrop blur
- Success: `#238B65`; caution: `#B7791F`; error: `#C44545`

Use accent colors to classify scheme cards; never imply eligibility status with color alone.

## 3. Typography
- Display: a modern rounded sans such as **Plus Jakarta Sans** or **Manrope**.
- Body: **Inter** or **DM Sans**.
- Large display headlines, compact readable body, high line-height for Gujarati.
- Ensure font fallback supports Gujarati glyphs; test line wrapping and mixed-language scheme names.

## 4. Layout principles
- 12-column desktop grid, max content width around 1280px.
- Mobile-first: 4-column grid, generous 16–20px gutters.
- Asymmetric masonry-like scheme discovery grid, but use stable CSS grid layout for accessibility and predictable reading order.
- Cards: 18–28px radius, fine border, soft shadow, large whitespace.
- Glass panels reserved for navigation, filters, and profile progress—not every surface.
- Sticky top nav on desktop; mobile bottom navigation for Discover, My Matches, Saved, Ask AI.

## 5. Motion language
Use Framer Motion (or equivalent) with purposeful choreography:
- Landing hero: soft floating abstract paper shapes and slow parallax blobs.
- Page transition: 180–260ms fade + slight vertical lift.
- Cards: staggered entrance (small delay), hover lift 3–5px, gentle tilt only on desktop and pointer devices.
- Profile step transition: horizontal slide with progress spring.
- Match result: restrained count-up / reveal; no confetti for government benefits.
- Chat: typing indicator and source citation reveal.
- Skeleton shimmer while loading.
- Respect `prefers-reduced-motion`; provide static equivalent.
- Avoid perpetual animation that distracts or harms battery/accessibility.

## 6. Screen specifications
### Landing
- Header: logo mark (friendly abstract “S”/path motif), Discover, How it works, Languages, Sign in optional.
- Hero: “The right support, made easier to find.” CTA “Find schemes for me.”
- Visual: overlapping colorful scheme cards with category illustrations and subtle floating animation.
- Trust strip: “Understand • Check potential eligibility • Apply on official portals.”
- Categories: Education, Farmer support, Women & family, Employment, Housing, Health, Social security.
- How-it-works 3 steps and privacy / official-source assurance.
- Footer with disclaimer, sources, privacy, feedback.

### Guided profile
- One question per screen or focused section.
- Left/upper progress indicator, “You can skip optional questions.”
- Illustrated contextual cards, segmented choices, accessible controls.
- Summary review before matching; editable responses.

### Results / Discover
- Header: “Potential matches for your profile” and clear disclaimer.
- Filter chips: State, category, benefit, “verified source.”
- Card design: color-coded editorial thumbnail/illustration, scheme title, ministry/state label, benefit summary, match state, “Why it may fit” link, source verification date.
- Grid responsive: 3 columns desktop, 2 tablet, 1 mobile; optional masonry aesthetic without visual disorder.
- Empty state offers edit profile / broaden filters.

### Scheme details
- Hero card with scheme title, issuing body, source badge, verified date.
- Summary of benefits and “Potential match” label.
- Eligibility checklist separated into Matched / Not met / Need to know.
- Documents checklist; application steps; official portal CTA opens external destination with warning.
- Related schemes and citation panel.

### Ask SchemeSathi
- Conversational layout, welcome prompt suggestions.
- Responses structured: short answer, details, sources, next steps.
- Inline scheme cards; citations always visible.
- Profile context clearly indicated and removable.
- Never show ungrounded “AI certainty” percentage.

### Saved / Compare
- Saved schemes list; compare up to 3 by benefit, eligibility, documents, geography, source freshness.
- “Saved locally on this device” if no account backend.

### Admin content review
- Table with status, scheme, state, source, last verified.
- Detail editor with source excerpt, eligibility rules, reviewed-by and date.
- Review/publish actions; audit trail.

## 7. Components
- `SchemeCard`, `MatchBadge`, `EligibilityCriterion`, `SourceCitation`, `VerifiedStamp`, `DocumentChecklist`, `StepProgress`, `ProfileQuestion`, `FilterChip`, `LanguageSwitcher`, `DisclaimerBanner`, `EmptyState`, `SkeletonCard`, `Toast`.
- Match badge text: “Potential match,” “Possible match,” “Need more details,” “Does not appear to match.”
- Source badge: “Official source” only when verified against approved domain/source.

## 8. Accessibility
- WCAG 2.2 AA target.
- Contrast test all text and controls.
- Visible focus ring, keyboard-operable menus/dialogs, skip links, semantic headings.
- Labels and helper text for form fields; do not rely on placeholder text.
- Screen-reader announce progress and result changes.
- Reduced motion, zoom up to 200%, touch targets >=44px.
- Color not sole differentiator; provide text/status icon.

## 9. Responsive behavior
- Mobile: stacked hero, bottom nav, single-column scheme cards, filters in bottom sheet.
- Tablet: 2-column cards.
- Desktop: 3-column discovery, optional filter sidebar.
- Avoid fixed-height text cards; prevent clipping of Gujarati.

## 10. Design quality bar
The result must feel art-directed and bespoke: thoughtful composition, cohesive illustrations, strong typography, rich but restrained color, polished microinteractions, and consistent component states. No generic template landing page, no dark theme, no default shadcn look without customization, no emoji-only icons.
