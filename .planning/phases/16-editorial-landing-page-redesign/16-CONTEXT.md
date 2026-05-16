# Phase 16: Editorial Landing Page Redesign — Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

The landing page (`app/page.tsx` + `components/hero/PushbackHero.tsx`) is the only surface in scope. The goal is purely visual/typographic: move the page out of "modern dark-SaaS template" grammar and into "editorial tool documentation" grammar. No copy changes from the recent positioning work (VET/SIGN/REPLY/RECOVER, the 4-pillar framing) — only the *visual representation* of that copy.

What is **NOT** in scope: the dashboard, the `/how-it-works` page, the auth pages, copy rewriting (recent work locked positioning copy), the 3D coverflow carousel (visual decision deferred — keep for now), the payment-tracking mockup section (keep), the document-generation 3-card section (keep), the reply-threading section (keep). Pricing copy was recently revised — keep.

</domain>

<decisions>
## Implementation Decisions

### Hero — kill the WebGL shader entirely
- **D-01:** Remove the WebGL fragment-shader hero on **all devices**, not just mobile. The earlier mobile-only gating (set during the perf-fix pass on 2026-05-16) shipped a static gradient fallback for mobile — that fallback is now the **default for everyone**. The fragment shader code path can be deleted from `PushbackHero.tsx`.
- **D-02:** Replace the shader background with a **two-layer composition**: (a) two static CSS radial gradients (lime + warm-dark), (b) one **inline SVG artifact** depicting a contract page with redlines/annotations on the right side of the hero (desktop) or bottom (mobile). The SVG is hand-authored, lives in `components/hero/HeroArtifactSVG.tsx`, and is decorative (`aria-hidden`).
- **D-03:** The SVG artifact is a **stylized contract page** ~600×800 viewBox with: ruled lines for text (no real legalese), a numbered clause structure, lime highlight bands over 2–3 "important clauses," a margin annotation in lime (e.g., "MISSING: kill fee"), and a subtle drop shadow. **Not** a photoreal screenshot — this is editorial illustration. The artifact reads as "the kind of thing this tool produces."

### Typography — introduce one editorial serif
- **D-04:** Add **Instrument Serif** (Google Fonts) as a second brand typeface. Load via `next/font/google` in `app/layout.tsx`. CSS variable `--font-serif`.
- **D-05:** Apply the serif to **exactly one major heading** in the hero: replace the four-word pillar line (`VET. / SIGN. / REPLY. / RECOVER.`) with the serif. The hover-glow GSAP animation stays; only the typeface changes. Keep all four words in serif italic for unified rhythm.
- **D-06:** The rest of the page stays Geist Sans. The serif is a punctuation point, not a system change.

### "What's inside" pillar grid → numbered editorial list
- **D-07:** Replace the current 4-card grid (added 2026-05-16 with Lucide icons + bordered card backgrounds) with a **numbered editorial list**:
  - 4 horizontal rows, separated by hairline rules (`1px solid var(--bg-border)`).
  - Each row: large serif numeral `01.` `02.` `03.` `04.` on the left (in Instrument Serif), followed by the pillar name in Geist sans bold, followed by the description in Geist sans regular.
  - No card backgrounds, no borders around items, no Lucide icons.
- **D-08:** The numeral is in `--brand-lime`. Pillar name in `--text-primary`. Description in `--text-secondary`.
- **D-09:** Layout is a single-column stack with generous vertical rhythm (~2rem between rows). Constrains to `max-w-3xl` instead of the previous `max-w-5xl` grid — narrower to feel editorial.

### Ticker — remove
- **D-10:** Delete the ticker section (`<div className="ticker-track ...">` with the 14 client situations scrolling). Remove the keyframes/CSS too if unused elsewhere. The section between the hero and the live demo just disappears — the hero ends with a 1px sentinel and the next section is the live demo, exactly as the rendered layout dictates after removal.

### What is NOT changed
- **D-11:** The 3D coverflow carousel stays unchanged. The user has flagged it as separately-evaluable; not in this phase.
- **D-12:** The payment-tracking mockup section, document-generation 3-card grid, reply-threading section, and pricing section remain unchanged.
- **D-13:** All copy stays unchanged — including the recently-revised pricing anchor strip and the "Not just AI emails" body in the hero.

### Performance
- **D-14:** With WebGL removed, the hero ships zero RAF, zero GSAP-on-shader, zero fragment-shader source. The remaining GSAP usage (per-line hover) stays — it's small and runs only on hover. Result: hero JS shrinks by the shader source size (~12KB minified inlined) and one `requestAnimationFrame` loop disappears.
- **D-15:** Mobile lighthouse performance score must be ≥85 (Success Criteria #5). The shader removal alone should clear this comfortably.

### Accessibility
- **D-16:** Hero artifact SVG is `aria-hidden="true"` with no semantic role — decorative.
- **D-17:** The serif headline keeps the existing GSAP hover-glow but **also** retains a focus-visible state for keyboard nav (current implementation may not have one — planner verifies and adds if missing).
- **D-18:** Numbered list rows use a semantic `<ol>` with `<li>` rather than `<div>` rows — improves screen-reader experience for the pillar sequence. Numerals are styled `::marker` or inline (planner picks; if `::marker` styling is limited, inline numerals in a `<span aria-hidden>` is acceptable).

</decisions>

<claudes-discretion>
## Claude's Discretion (planner free to decide)

- Exact hex/rgb values for the static gradient layers (constraint: must feel like the previous shader hero so the visual change is the artifact, not the colors)
- SVG dimensions/aspect ratio of the hero artifact (constraint: must look "tall like a contract page", typically 3:4)
- Whether to use `::marker` or inline `<span>` for the serif numerals (depends on browser CSS support — pick what is robust)
- Whether to ship a separate `HeroArtifactSVG` file or inline the SVG in `PushbackHero.tsx` (lean toward separate file for readability since the SVG will be large)
- Whether to add `font-display: swap` for Instrument Serif (yes, per font-loading best practice — but defaults from `next/font/google` may already cover this; planner verifies)
- Plan-file count — expect ~3 plans: (1) typography wiring + hero SVG component, (2) hero shader removal + artifact composition + serif headline, (3) pillar list rewrite + ticker removal + lighthouse verification

</claudes-discretion>

<recent-work-relation>
## Relation to Recent Work (2026-05-16 perf+positioning pass)

The same day this phase is being planned, the landing page received:
- Mobile/reduced-motion gating for the WebGL shader (now superseded — D-01 removes the shader entirely)
- Carousel `filter: blur()` removed on mobile
- `next/dynamic` lazy-loading of below-fold heavy components
- Hero copy rewrite (VET/SIGN/REPLY/RECOVER + "operating system for difficult clients") — **preserved**
- 4-pillar "What's inside" strip added below hero — **the visual representation of this is what Phase 16 rewrites** (the *copy* of the four pillars is preserved)
- Pricing value-anchor strip + 30-day money-back — **preserved**
- Cookie consent banner — **preserved**

None of the above is reverted. Phase 16 only changes the visual grammar of the hero and the 4-pillar section, and removes the ticker.

</recent-work-relation>
