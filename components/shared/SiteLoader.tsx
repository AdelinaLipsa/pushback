'use client'

import { useEffect, useState } from 'react'

export default function SiteLoader() {
  const [fading, setFading] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 400)
    const t2 = setTimeout(() => setGone(true), 1000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (gone) return null

  return (
    <>
      <style>{`
        @keyframes site-loader-fade {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes dot-glow {
          0%, 100% { opacity: 1;   text-shadow: 0 0 8px #84cc16, 0 0 24px #84cc1650; }
          50%       { opacity: 0.4; text-shadow: none; }
        }
        .site-loader          { opacity: 1; pointer-events: all; }
        .site-loader.fading   {
          animation: site-loader-fade 0.55s ease forwards;
          pointer-events: none;
        }
      `}</style>
      <div
        aria-hidden
        className={`site-loader${fading ? ' fading' : ''}`}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: '#0a0a0a',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', userSelect: 'none' }}>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.025em', color: '#fafafa' }}>
            Pushback
          </span>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#84cc16', animation: 'dot-glow 1.6s ease-in-out infinite' }}>
            .
          </span>
        </div>
      </div>
    </>
  )
}
