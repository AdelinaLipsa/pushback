import type { Instrumentation } from 'next'
import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
}

export const onRequestError: Instrumentation.onRequestError = Sentry.captureRequestError
