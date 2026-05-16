'use client'

import { useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { readConsent } from './CookieConsent'

export default function ConsentGatedAnalytics() {
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    setAccepted(readConsent() === 'accepted')
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      setAccepted(detail === 'accepted')
    }
    window.addEventListener('pushback-consent-change', handler)
    return () => window.removeEventListener('pushback-consent-change', handler)
  }, [])

  if (!accepted) return null
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}
