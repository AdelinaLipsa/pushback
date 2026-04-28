'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const STEPS = ['Reading contract', 'Mapping clause types', 'Calculating risk score']

const SCAN_LINES = [
  { w: '85%', flagged: true  },
  { w: '72%', flagged: false },
  { w: '90%', flagged: true  },
  { w: '60%', flagged: false },
  { w: '78%', flagged: true  },
  { w: '45%', flagged: false },
  { w: '83%', flagged: true  },
  { w: '55%', flagged: false },
]

interface ContractPendingStateProps {
  contractId: string
}

export default function ContractPendingState({ contractId }: ContractPendingStateProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const stepRef = useRef(0)
  const ivRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => {
    // Cycle through scan steps for visual effect
    ivRef.current = setInterval(() => {
      stepRef.current = (stepRef.current + 1) % STEPS.length
      setStep(stepRef.current)
    }, 1200)

    // Poll for completion every 4 seconds
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/contracts/${contractId}`)
        if (!res.ok) return
        const { contract } = await res.json()
        if (contract.status === 'analyzed') {
          toast.success('Contract analyzed — here are your results.')
          router.refresh()
        } else if (contract.status === 'error') {
          toast.error('Analysis failed. Please try again.')
          router.refresh()
        }
      } catch {
        // network error — will retry on next interval
      }
    }

    pollRef.current = setInterval(checkStatus, 4000)

    return () => {
      clearInterval(ivRef.current)
      clearInterval(pollRef.current)
    }
  }, [router, contractId])

  const activeLines = step >= 1

  return (
    <div className="fade-up flex flex-col items-center justify-center py-16 px-4" style={{ maxWidth: 480, margin: '0 auto' }}>

      {/* Status row */}
      <div className="flex items-center gap-2.5 mb-6">
        <div style={{
          width: 9, height: 9, borderRadius: '50%', backgroundColor: '#84cc16', flexShrink: 0,
          animation: 'pulse 1.1s ease-in-out infinite',
        }} />
        <p className="text-[0.82rem] font-semibold" style={{ color: '#84cc16' }}>
          {STEPS[step]}
        </p>
      </div>

      {/* Document skeleton */}
      <div style={{
        width: '100%',
        backgroundColor: '#111114',
        border: '1px solid #222225',
        borderRadius: '0.625rem',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        marginBottom: '1.5rem',
      }}>
        {SCAN_LINES.map((line, i) => (
          <div key={i} style={{
            height: 7, borderRadius: 9999, width: line.w,
            backgroundColor: line.flagged && activeLines ? 'rgba(249,115,22,0.3)' : '#1e1e22',
            transition: 'background-color 0.6s ease',
          }} />
        ))}
      </div>

      {/* Step checklist */}
      <div className="flex flex-col gap-3 w-full" style={{ maxWidth: 300 }}>
        {STEPS.map((label, i) => {
          const done = i < step
          return (
            <div key={i} className="flex items-center gap-2.5" style={{ opacity: done ? 1 : i === step ? 0.75 : 0.28, transition: 'opacity 0.4s ease' }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                border: `1.5px solid ${done ? '#84cc16' : i === step ? 'rgba(132,204,22,0.4)' : '#3f3f46'}`,
                backgroundColor: done ? 'rgba(132,204,22,0.15)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.4s ease',
              }}>
                {done && (
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#84cc16" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <p className="text-[0.78rem]" style={{ color: done ? '#a1a1aa' : i === step ? '#71717a' : '#3f3f46', transition: 'color 0.4s ease' }}>
                {label}
              </p>
            </div>
          )
        })}
      </div>

      <p className="text-[0.72rem] mt-8" style={{ color: '#3f3f46' }}>
        This takes about 15–30 seconds
      </p>
    </div>
  )
}
