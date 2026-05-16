import * as Sentry from '@sentry/nextjs'

let sentryInitialised = false

function initSentry() {
  if (sentryInitialised) return
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    debug: false,
  })
  sentryInitialised = true
}

if (typeof window !== 'undefined') {
  try {
    if (window.localStorage.getItem('pushback-consent') === 'accepted') {
      initSentry()
    }
  } catch {
    /* storage blocked — stay un-initialised until consent fires */
  }

  window.addEventListener('pushback-consent-change', (e) => {
    if ((e as CustomEvent).detail === 'accepted') initSentry()
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
