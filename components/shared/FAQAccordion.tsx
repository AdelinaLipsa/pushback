'use client'

import { useState } from 'react'

interface FAQItem {
  q: string
  a: string
}

export default function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {items.map(({ q, a }, i) => {
        const isOpen = openIndex === i
        return (
          <div
            key={q}
            style={{
              background: 'var(--bg-surface)',
              border: `1px solid ${isOpen ? 'rgba(132,204,22,0.3)' : 'var(--bg-border)'}`,
              borderRadius: '0.75rem',
              overflow: 'hidden',
              transition: 'border-color 220ms ease, box-shadow 220ms ease',
              boxShadow: isOpen ? '0 0 30px rgba(132,204,22,0.06)' : 'none',
            }}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                padding: '1.25rem 1.5rem',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                textAlign: 'left',
              }}
            >
              <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600 }}>{q}</span>
              <span style={{
                flexShrink: 0,
                width: 22,
                height: 22,
                borderRadius: '50%',
                border: `1px solid ${isOpen ? 'rgba(132,204,22,0.5)' : 'var(--bg-border)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                lineHeight: 1,
                color: isOpen ? 'var(--brand-lime)' : 'var(--text-muted)',
                background: isOpen ? 'rgba(132,204,22,0.08)' : 'transparent',
                transition: 'all 220ms ease',
                transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                userSelect: 'none',
              }}>+</span>
            </button>

            {/* CSS grid trick: animates height without measuring */}
            <div style={{
              display: 'grid',
              gridTemplateRows: isOpen ? '1fr' : '0fr',
              transition: 'grid-template-rows 280ms ease',
            }}>
              <div style={{ overflow: 'hidden' }}>
                <div style={{
                  padding: '0 1.5rem 1.25rem',
                  borderTop: `1px solid ${isOpen ? 'rgba(132,204,22,0.15)' : 'var(--bg-border)'}`,
                  paddingTop: '1rem',
                  transition: 'border-color 220ms ease',
                }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.7 }}>{a}</p>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
