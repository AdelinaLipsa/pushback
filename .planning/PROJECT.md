# Pushback

## What This Is

Pushback is an AI-powered tool for freelancers that generates professional, firm responses to difficult client situations — scope creep, late payments, cancellations, ghosting, and more. Freelancers describe their situation, choose a defense tool, and get a ready-to-send message crafted by Claude. It also analyzes contracts for risk before freelancers sign them.

## Core Value

A freelancer in an uncomfortable client situation gets a professional, ready-to-send response in under 30 seconds.

## Requirements

### Validated

- ✓ Next.js 15 App Router scaffold with TypeScript, Tailwind, shadcn/ui — existing
- ✓ Supabase auth (email/password + Google OAuth) — existing
- ✓ 8 AI defense tools (scope creep, late payment, cancellation, ghosting, revision abuse, undervaluing, rush jobs, contract disputes) — existing
- ✓ Contract PDF/text upload and risk analysis via Anthropic Files API — existing
- ✓ Free tier (3 AI responses, 1 contract analysis) + Pro subscription via Creem — existing
- ✓ Response history per project — existing
- ✓ Multi-table Supabase schema with RLS — existing

### Active

- [ ] Critical bug fixes (defend route try/catch, usage counter race condition, auth callback error handling)
- [ ] Input validation with Zod on all POST API routes
- [ ] Atomic plan gating (Supabase RPC to eliminate race condition on free-tier limit)
- [ ] Security hardening (security headers in next.config.ts, webhook secret null check, service-role client cleanup)
- [ ] Privacy and Terms pages (required for legal compliance and payment processor)
- [ ] Project and contract delete UI (API routes exist, buttons missing)
- [ ] Project edit UI (API route exists, no form)
- [ ] Transactional emails on signup and upgrade (Resend installed, unimplemented)
- [ ] Supabase type generation to eliminate `any` casts on joined queries
- [ ] /settings route added to middleware matcher

### Out of Scope

- Team/agency plans — post-launch, after validating individual freelancer demand
- Contract template generation — separate product scope; post-launch
- Chrome extension — significant platform work; post-launch
- Credits-based pricing — not building; subscription model is the decision
- Monthly usage counter reset — post-launch operational concern
- Test suite — not blocking launch, but should be first post-launch technical investment

## Context

The codebase is a complete scaffold built 2026-04-23 — all pages, API routes, and components exist. The architecture is sound (proper Next.js App Router layering, server-side AI calls, RLS-enforced data isolation, three-layer auth). However, the scaffold has several launch-blocking quality gaps:

- **Error handling is scaffold-quality**: the defend route and contract analysis route lack try/catch and will fail ungracefully under real conditions
- **Race condition on plan gating**: free-tier limit check is a non-atomic read-then-write; concurrent requests can exceed the limit
- **No input validation**: POST bodies passed directly to Anthropic prompts
- **Missing UI**: delete and edit actions exist in the API but have no UI surface
- **Missing pages**: /privacy and /terms 404; referenced in footer and signup
- **Dead dependency**: `resend` installed but nothing wired
- **Zero test coverage**: all critical revenue paths (checkout, plan gating, webhook, AI generation) untested

The Anthropic Files API integration uses beta endpoints with `as any` casts — acceptable for now, must be monitored against SDK updates.

## Constraints

- **Tech stack**: Next.js 16, TypeScript, Supabase, Anthropic Claude, Stripe, Resend — locked
- **Hosting**: Vercel (assumed from Next.js + Supabase stack)
- **Pricing model**: Free tier (3 responses, 1 contract) + Pro subscription — decided
- **Target user**: All freelancers broadly — no specific niche for v1
- **Launch goal**: First paying customers — validating the business, not just shipping

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Free tier + pro subscription | Lower barrier to try → discover value → natural upgrade pressure. Predictable MRR vs credits. | — Pending |
| All AI calls server-side only | Never expose Anthropic API key to client | ✓ Good |
| RLS as authoritative data guard | DB-enforced isolation survives any API bug | ✓ Good |
| Three-layer auth (middleware + layout + route handler) | Defense-in-depth; any layer failing alone doesn't expose data | ✓ Good |
| Supabase RPC for atomic plan gating | Non-atomic read-then-write creates race condition exploitable by free users | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-23 after initialization*
