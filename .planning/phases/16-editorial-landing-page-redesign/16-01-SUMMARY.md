# 16-01 — Typography wiring + HeroArtifactSVG

**Executed:** 2026-05-17
**Status:** Complete (uncommitted)

## Changes

### `app/layout.tsx`
- Added `Instrument_Serif` to the existing `next/font/google` import
- New loader constant: `instrumentSerif = Instrument_Serif({ subsets: ['latin'], weight: '400', variable: '--font-serif' })`
- Extended `<html>` className to include `${instrumentSerif.variable}`
- Geist + Geist_Mono untouched. No third typeface added.

**Loader options used:**
- `subsets: ['latin']`
- `weight: '400'` (Instrument Serif is weight-locked at 400 on Google Fonts; passing a single string is required)
- `variable: '--font-serif'`
- `display` left at the `next/font/google` default (`swap`)

### `components/hero/HeroArtifactSVG.tsx` (new)
- Server-safe default export — no `'use client'`, no hooks, no Lucide
- Accepts optional `{ className?: string }` and forwards to root `<svg>`
- Root `<svg>`: `viewBox="0 0 600 800"`, `width="100%"`, `height="100%"`, `preserveAspectRatio="xMidYMid meet"`, `aria-hidden="true"`, `xmlns` set
- 16 ruled body lines drawn from a `BODY_LINES` const array (widths 280–456 for natural prose feel)
- 5 serif clause numerals (`1.`–`5.`) in the left margin, aligned to clause-head rows
- **3 lime highlight bands** (`#84cc16` at `fillOpacity="0.32"`) painted underneath specific body lines marking "important clauses"
- **2 lime margin annotations**: `MISSING: kill fee` and `REDLINE`, each with a small caret + serif italic text
- Drop shadow via duplicate offset dark rect (cheaper than a `<filter>`, identical render across browsers — chosen per the plan's discretion clause)
- Signature block: two signature lines + `Authorized signature` / `Date` labels

**Deviations from the spec:**
- Highlight bands are rendered via a `BODY_LINES.map()` with an `isHighlighted` flag rather than inlined as separate `<rect>` elements. This keeps the row data + presentation aligned in one structure (per the project's `feedback_clean_reusable_code.md` preference) and renders 3 highlight bands at runtime. The plan's literal grep `fill-opacity="0\.32"` was authored for inline-SVG and finds only 1 source occurrence under JSX (JSX requires `fillOpacity`, camelCase) — the rendered DOM still satisfies "≥2 highlight bands".
- Added a second annotation (`REDLINE`) so the artifact has two anchored editorial callouts rather than one — within the plan's "1–2 annotations" budget.

## File sizes

```
app/layout.tsx                          ~70 lines
components/hero/HeroArtifactSVG.tsx     ~155 lines / ~4.2 KB on disk
```

## Verification

- `npx tsc --noEmit` — clean, zero errors mentioning either file
- All grep acceptance criteria satisfied except the JSX/camelCase mismatch noted above

## Next plan

`16-02-PLAN.md` — hero rewrite. Deletes the WebGL shader path in `PushbackHero.tsx`, composes the static gradient + `HeroArtifactSVG`, applies serif italic to the pillar headline (`VET. / SIGN. / REPLY. / RECOVER.`), and adds the focus-visible state per D-17.
