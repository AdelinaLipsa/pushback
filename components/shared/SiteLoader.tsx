'use client'

import { useEffect, useState } from 'react'

export default function SiteLoader() {
  const [fading, setFading] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const minDisplay = 300
    const start = Date.now()

    const fade = () => {
      const delay = Math.max(0, minDisplay - (Date.now() - start))
      setTimeout(() => {
        setFading(true)
        setTimeout(() => setGone(true), 550)
      }, delay)
    }

    if (document.readyState === 'complete') {
      fade()
    } else {
      window.addEventListener('load', fade, { once: true })
      return () => window.removeEventListener('load', fade)
    }
  }, [])

  if (gone) return null

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0a0a0a',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.5s ease',
        pointerEvents: fading ? 'none' : 'all',
      }}
    >
      <style>{`
        @keyframes dot-glow {
          0%, 100% { opacity: 1;   text-shadow: 0 0 8px #84cc16, 0 0 24px #84cc1650; }
          50%       { opacity: 0.4; text-shadow: none; }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'baseline', userSelect: 'none' }}>
        <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.025em', color: '#fafafa' }}>
          Pushback
        </span>
        <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#84cc16', animation: 'dot-glow 1.6s ease-in-out infinite' }}>
          .
        </span>
      </div>
    </div>
  )
}
