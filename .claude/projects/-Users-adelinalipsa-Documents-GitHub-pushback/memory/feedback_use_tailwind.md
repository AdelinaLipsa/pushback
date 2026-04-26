---
name: Use Tailwind classes, not inline styles
description: Project uses Tailwind 4 — always use utility classes, never inline style={{}} except for truly dynamic computed values
type: feedback
---

Always use Tailwind utility classes. Never reach for `style={{}}` when a Tailwind class exists.

**Why:** The project is on Tailwind 4 with a full design token setup in `globals.css` (`@theme inline`). All CSS variables (`--bg-surface`, `--brand-lime`, etc.) are available as Tailwind tokens (`bg-bg-surface`, `text-brand-amber`, etc.).

**How to apply:**
- `var(--bg-surface)` → `bg-bg-surface`
- `var(--bg-base)` → `bg-bg-base`
- `var(--bg-elevated)` → `bg-bg-elevated`
- `var(--bg-border)` → `border-bg-border` / `bg-bg-border`
- `var(--brand-lime)` → `bg-brand-lime` / `text-brand-lime` (`#84cc16` — `--color-brand-lime` is in `@theme inline`)
- `var(--text-primary)` → `text-text-primary`
- `var(--text-secondary)` → `text-text-secondary`
- `var(--text-muted)` → `text-text-muted`
- Use arbitrary values `bg-[rgba(...)]` for partial-opacity variants
- Only keep `style={{}}` for genuinely dynamic computed values (e.g. animation delays derived from loop index, widths derived from JS state)
