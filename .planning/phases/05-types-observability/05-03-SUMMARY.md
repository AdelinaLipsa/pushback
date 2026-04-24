---
plan: 05-03
phase: 05-types-observability
status: complete
completed: 2026-04-24
---

# Plan 05-03: Sentry + Anthropic Alert — Summary

## What was built

- Installed `@sentry/nextjs` v10.50.0
- `instrumentation.ts` — Next.js 16 server hook: `register()` + `onRequestError = Sentry.captureRequestError`
- `instrumentation-client.ts` — Next.js 15.3+ client init (replaces legacy sentry.client.config.ts pattern)
- `sentry.server.config.ts` — server-side `Sentry.init` with `tracesSampleRate: 0`
- `next.config.ts` — wrapped with `withSentryConfig(org: bitly-2h, project: pushback)`, CSP `connect-src` extended with `https://sentry.io https://*.sentry.io`
- Sentry project created via API: org `bitly-2h`, project `pushback` (DE region)
- DSN and auth token saved to `.env.local`

## OBS-02 — Anthropic billing alert

Manual dashboard step. User to confirm at console.anthropic.com → Settings → Billing → Spend alerts ($10/month threshold).

## Performance/replay disabled

`tracesSampleRate: 0`, `replaysSessionSampleRate: 0`, `replaysOnErrorSampleRate: 0` — per D-09.

## Self-Check: PASSED
