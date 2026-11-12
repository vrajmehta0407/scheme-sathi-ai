# Scheme Sathi AI: Design System (design.md)

**Direction:** Light, colourful, glassy, Pinterest-style masonry, with a civic, trustworthy but joyful feel. Inspired by Indian *jaali* lattice and rangoli geometry, animated softly. Not dark theme. Not a template look.

---

## 1. Three-Colour Palette (strict)
Two main colours plus one different accent. This palette is intentionally different from the other projects: GridMind (violet + lime) and FoodRescue (tangerine + teal + berry pink). Do not reuse any of those.

| Role | Name | Hex |
|---|---|---|
| Main 1 | **Civic Blue** | `#1479FF` |
| Main 2 | **Sunbeam Yellow** | `#FFC20E` |
| Accent (different) | **Parrot Green** | `#12B76A` |
| Ink (text) | Midnight Navy | `#0A1A3C` |
| Surface | Frost White | `#FFFFFF` |
| Page tint | Sky Mist | `#F0F6FF` (blue-tinted white, never cream or beige) |

**Rules**
- Blue = navigation, primary buttons, links, charts, the "Sathi" brand.
- Yellow = highlights, benefit amounts, deadlines, "new" stickers, call-to-action glow. Yellow is never used for text; put Midnight Navy text on yellow.
- Green = the "different" accent, used for *Eligible*, claimed, approved, success and positive deltas, at about 5-10% of a screen.
- Status mapping (no traffic-light red): Eligible = green, Likely = yellow, Not eligible = blue outline (neutral, not alarming), Needs document = yellow dot.
- No violet, lime, tangerine/orange, teal, pink, cream or beige anywhere.
- Tints only from opacity of the three colours (blue, yellow 8/16/32%; green 10/20%).
- Charts use blue, yellow, green and tints/shades of those, plus navy for text; use patterns/labels so no chart relies on colour alone.

## 2. Background
Animated **jaali lattice**: a fine SVG geometric lattice (blue lines at 8% opacity) slowly drifting, with 3-4 large blurred blobs (blue and yellow at 20-30%, `blur(90px)`) and one small green glow, over Sky Mist. A soft rangoli-style radial pattern rotates very slowly (120 s loop) behind the hero. 3% noise overlay.

## 3. Glass Surfaces
```css
.glass {
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(18px) saturate(150%);
  border: 1px solid rgba(255,255,255,0.8);
  box-shadow: 0 10px 34px rgba(20,121,255,0.14), inset 0 1px 0 rgba(255,255,255,0.9);
  border-radius: 26px;
}
.glass-blue   { background: rgba(20,121,255,0.12); border-color: rgba(20,121,255,0.28); }
.glass-yellow { background: rgba(255,194,14,0.22);  border-color: rgba(255,194,14,0.5); }
.glass-green  { background: rgba(18,183,106,0.14);  border-color: rgba(18,183,106,0.32); }
```
Fallback without `backdrop-filter`: solid `rgba(255,255,255,0.93)`.

## 4. Typography
- Display: **Sora** (700) or **Outfit** (700), tight tracking
- Body: **Manrope** (400/500/600)
- Numbers and tables: **IBM Plex Mono** or Manrope tabular-nums
- Indic scripts: **Noto Sans Devanagari** and **Noto Sans Gujarati** (self-hosted via `next/font`, no CDN calls)
- Scale: 12 / 14 / 16 / 20 / 28 / 40 / 64 / 96. The headline benefit number ("Rs. 1,24,000 / year") is the hero element.

## 5. Layout: Pinterest Masonry
- **Scheme board** is a masonry grid of scheme "pins" with mixed heights (compact pin, tall pin with benefit chart, featured pin with illustration).
- **Dashboards** are bento-masonry: mixed-size glass tiles (big map tile, tall funnel tile, small KPI tiles).
- 4 columns desktop, 2 tablet, 1 mobile; gap 20px.
- Pin types: Scheme Pin, Benefit Pin, Deadline Pin, Document Pin, Insight Pin, Stat Pin.

## 6. Signature Components
1. **Sathi Wizard:** one question per card, large tappable chips and sliders, a friendly animated companion bubble (simple geometric character, two colours), live counter "23 schemes found" ticking up.
2. **Scheme Pin:** category icon, scheme name, benefit amount in a yellow sticker, status badge, mini progress ring for document readiness.
3. **Eligibility Meter:** semi-circle gauge, green fill for criteria passed, blue outline for pending, animated needle.
4. **Near-Miss Ribbon:** a tape-like banner on a pin ("Rs. 20,000 over the limit") with a tiny slider to preview.
5. **What-if Sliders:** chunky pill sliders (income, age, land); pins animate in and out of the board with spring physics as results change.
6. **India Coverage Map:** choropleth from bundled TopoJSON, blue scale with yellow highlight on hover, tooltip card, animated state-by-state draw-in.
7. **Funnel and Sankey:** profile, eligible, documents ready, applied, approved; animated flow.
8. **Insight Pin:** large number plus one sentence, yellow underline highlight.
9. **Checklist Wallet:** document cards that flip to reveal "where to get it".
10. **Benefit Counter:** hero count-up with confetti burst (blue, yellow, green only) when total crosses a milestone.

## 7. Motion (2026 feel)
- **Framer Motion / Motion One**, **GSAP ScrollTrigger**, **Lenis** smooth scroll.
- Entry: staggered reveal (translateY 24px, blur 8px to 0, 60ms stagger).
- Layout animations (Framer `layout`) so pins reshuffle smoothly when filters change.
- Count-ups: `cubic-bezier(.22,1,.36,1)`, 1.2 s. Charts draw on (stroke-dashoffset, bar grow from baseline).
- Hover: pin lifts 6px, tilts up to 4deg, specular highlight follows the pointer.
- Landing: pinned scroll story (Ask, Match, Apply), horizontal scheme-category carousel, marquee of scheme names in three languages.
- Cursor: soft blue blob follower with yellow ring on interactive elements (desktop only).
- `prefers-reduced-motion`: disable drift, tilt, lattice animation and count-ups.

## 8. Dashboard Design Rules
- Every chart sits in a glass tile with a title, one-line takeaway, filter chips and an "Export" menu.
- Chart types: bar, stacked bar, donut, line/area, choropleth map, funnel, heatmap (overlap matrix), scatter (income vs benefit), small multiples.
- Sequential scale: light blue to Civic Blue; categorical: blue, yellow, green, navy, light-blue, light-yellow (max 6 series; group the rest as "Other").
- Always show units (Rs., %, people), a data-source badge ("Synthetic data" in yellow), and a table view toggle for accessibility.
- Large KPI numbers use IBM Plex Mono with a small delta chip (green up, blue-outline down).

## 9. Shape and Spacing
- Radii: 12 (chips), 20 (inputs), 26 (cards), 999 (pills). 8px grid. Section padding 96px desktop, 56px mobile.
- Icons: Phosphor duotone, 1.75 stroke. Illustrations: simple flat geometric two-colour shapes.

## 10. Landing Page Sections
1. Hero: headline "Your schemes. Found." with a floating glass wizard card and a counting "Rs. unclaimed" ticker
2. Marquee of scheme names in English, Hindi and Gujarati
3. How it works (3 pinned steps: Tell, Match, Apply)
4. Interactive demo: drag income slider, watch scheme pins appear
5. Masonry of scheme category cards (Farmers, Students, Women, Seniors, Workers, Health, Housing)
6. Dashboard preview in a glass browser frame
7. Privacy promise ("No login, no keys, no tracking")
8. CTA with lattice background

## 11. Accessibility
- Midnight Navy `#0A1A3C` text on glass and on yellow; white text only on solid Civic Blue (check 4.5:1) or solid dark Green `#0B8A50`
- Never colour alone: icons and text on all statuses
- 48px minimum tap targets; 3px blue focus ring with white offset
- Full keyboard support; charts have table fallbacks and aria labels
- Indic font sizes at least 16px body; avoid text over busy patterns

## 12. Tokens (Tailwind)
```js
colors: {
  blue:   { DEFAULT:'#1479FF', 50:'#EAF3FF', 100:'#D1E5FF', 500:'#1479FF', 700:'#0B57C4' },
  yellow: { DEFAULT:'#FFC20E', 50:'#FFF7DA', 100:'#FFEBA6', 500:'#FFC20E', 700:'#D69E00' },
  green:  { DEFAULT:'#12B76A', 50:'#E3F8EE', 100:'#BDEFD6', 500:'#12B76A', 700:'#0B8A50' },
  ink: '#0A1A3C', mist: '#F0F6FF'
}
```

## 13. Do / Don't
| Do | Don't |
|---|---|
| Plain words, big numbers, friendly Sathi tone | Government-form look or legal jargon |
| Three colours plus neutrals, green as a rare accent | Extra colours, red alarm styling, cream tones |
| Layout animations that explain change | Animation for its own sake |
| Clear "sample data / verify officially" notes | Hide data caveats |
