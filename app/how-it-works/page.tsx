import Link from 'next/link'
import { DEFENSE_TOOLS } from '@/lib/defenseTools'
import Footer from '@/components/shared/Footer'
import DemoAnimation from '@/components/hero/DemoAnimation'

const TOOL_GROUPS: { heading: string; color: string; types: string[] }[] = [
  {
    heading: 'Payment Issues',
    color: '#ef4444',
    types: ['payment_first', 'payment_second', 'payment_final', 'retroactive_discount', 'disputed_hours'],
  },
  {
    heading: 'Scope & Delivery',
    color: '#f59e0b',
    types: ['scope_change', 'revision_limit', 'moving_goalposts', 'post_handoff_request', 'delivery_signoff'],
  },
  {
    heading: 'Client Behavior',
    color: '#84cc16',
    types: ['ghost_client', 'feedback_stall', 'chargeback_threat', 'review_threat', 'dispute_response', 'spec_work_pressure'],
  },
  {
    heading: 'Pricing & Rates',
    color: '#a78bfa',
    types: ['discount_pressure', 'rate_increase_pushback', 'rush_fee_demand', 'kill_fee', 'ip_dispute'],
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Paste the client message',
    body: 'Drop any email, DM, or message into the analyze box. Pushback reads it in seconds and identifies exactly what kind of situation you\'re dealing with — scope creep, late payment, ghosting, rate pressure, dispute.',
  },
  {
    n: '02',
    title: 'Pick your defense tool',
    body: 'Pushback pre-selects the right tool automatically. Or browse the full arsenal of 21 situation-specific tools and pick the one that fits. Each tool is built for a specific client problem — not a generic AI chat.',
  },
  {
    n: '03',
    title: 'Copy a professional reply',
    body: 'A firm, ready-to-send response is drafted in seconds. If you\'ve uploaded your contract, the reply references your actual clauses — payment terms, revision limits, kill fee. Edit if you want, copy, send.',
  },
]

const FAQS = [
  {
    q: 'How many responses can I generate on the free plan?',
    a: '1 AI-generated response and 1 contract analysis — enough to try the full flow end-to-end. Pro accounts get 150 responses and 50 contract analyses per month.',
  },
  {
    q: 'How is this different from asking ChatGPT?',
    a: 'Pushback uses 21 battle-tested response frameworks built specifically for client disputes — not a general-purpose chat. It knows your contract, tracks your project history, and drafts responses that reference your actual terms. The output is copy-ready, not a draft you need to rewrite.',
  },
  {
    q: 'Where do my client messages and contracts go?',
    a: 'Pushback sends them to Anthropic (Claude) as a data processor to generate responses. Anthropic does not retain your content for training. Raw contract text is read, analyzed, and discarded — only the structured analysis is stored on your account.',
  },
  {
    q: 'What if Pushback identifies the wrong situation?',
    a: 'You can ignore the suggestion and pick a different tool from the sidebar. Every response is also editable before you copy or send — Pushback drafts the message, you decide what goes out.',
  },
  {
    q: 'Is the AI output legal advice?',
    a: 'No. Pushback drafts professional, ready-to-send responses based on your situation and contract. It is not a substitute for a lawyer. For high-stakes disputes, escalate to a qualified professional.',
  },
  {
    q: 'Can I cancel my Pro subscription anytime?',
    a: 'Yes — from the billing portal in your account settings. You keep Pro access until the end of the current billing period.',
  },
]

export default function HowItWorksPage() {
  return (
    <div style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh' }}>

      {/* Logo header */}
      <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem 0' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.1rem', textDecoration: 'none' }}>
          <span style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Pushback</span>
          <span style={{ color: 'var(--brand-lime)', fontWeight: 800, fontSize: '1.4rem' }}>.</span>
        </Link>
      </div>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '3rem 1.5rem 3.5rem', maxWidth: '700px', margin: '0 auto' }}>
        <p style={{ color: 'var(--brand-lime)', fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1.25rem' }}>
          How Pushback works
        </p>
        <h1 style={{ color: 'var(--text-primary)', fontSize: 'clamp(2.4rem, 5vw, 3.75rem)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: '1.25rem' }}>
          A professional reply to any client situation. In under 30 seconds.
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.65 }}>
          Paste the message. Pushback identifies what&apos;s happening, picks the right tool, and drafts a firm reply — using your actual contract clauses if you&apos;ve uploaded one.
        </p>
      </div>

      {/* DEMO — full width cinematic */}
      <div style={{ padding: '0 1.5rem 6rem', maxWidth: '900px', margin: '0 auto' }}>
        <DemoAnimation />
      </div>

      {/* How it works — 3 steps */}
      <div style={{ padding: '0 1.5rem 6rem', maxWidth: '900px', margin: '0 auto' }}>
        <p style={{ color: 'var(--brand-lime)', fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>
          The workflow
        </p>
        <h2 style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '3rem', textAlign: 'center', lineHeight: 1.1 }}>
          Three steps. No legal background required.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {STEPS.map(step => (
            <div key={step.n} style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              borderRadius: '0.875rem',
              padding: '2rem',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <span style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '2.5rem',
                fontWeight: 800,
                color: 'rgba(132,204,22,0.12)',
                lineHeight: 1,
                marginBottom: '1.25rem',
                letterSpacing: '-0.04em',
              }}>
                {step.n}
              </span>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', letterSpacing: '-0.01em' }}>
                {step.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.65 }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* What makes it different */}
      <div style={{ padding: '0 1.5rem 6rem', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--bg-border)',
          borderRadius: '1rem',
          padding: '2.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2rem',
        }}>
          <div>
            <p style={{ color: 'var(--brand-lime)', fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '0.25rem' }}>21</p>
            <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem' }}>Defense tools</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>Situation-specific, not generic. Each tool is built for one exact type of client problem.</p>
          </div>
          <div>
            <p style={{ color: 'var(--brand-lime)', fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '0.25rem' }}>&lt;30s</p>
            <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem' }}>Time to a reply</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>Paste, detect, generate, copy. The whole flow takes under 30 seconds start to finish.</p>
          </div>
          <div>
            <p style={{ color: 'var(--brand-lime)', fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '0.25rem' }}>Contract</p>
            <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem' }}>Clause-aware</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>Upload your contract once. Every response quotes your actual payment terms, revision limits, and kill fee — not generic advice.</p>
          </div>
          <div>
            <p style={{ color: 'var(--brand-lime)', fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '0.25rem' }}>0</p>
            <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem' }}>Rewriting required</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>Output is copy-ready. You edit if you want to, but most responses go out exactly as drafted.</p>
          </div>
        </div>
      </div>

      {/* Full tool directory */}
      <div style={{ padding: '0 1.5rem 6rem', maxWidth: '900px', margin: '0 auto' }}>
        <p style={{ color: 'var(--brand-lime)', fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>
          The arsenal
        </p>
        <h2 style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.75rem', textAlign: 'center', lineHeight: 1.1 }}>
          21 tools. Every client nightmare covered.
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '3rem', textAlign: 'center' }}>
          Pick one when you know exactly what you&apos;re dealing with. Or paste the message and let Pushback decide.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
          {TOOL_GROUPS.map(group => (
            <div key={group.heading}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: group.color, flexShrink: 0 }} />
                <p style={{ color: 'var(--text-primary)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {group.heading}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {group.types.map(type => {
                  const tool = DEFENSE_TOOLS.find(t => t.type === type)
                  if (!tool) return null
                  return (
                    <div key={type}>
                      <p style={{ color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.15rem' }}>{tool.label}</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: 1.5 }}>{tool.description}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contract analysis */}
      <div style={{ padding: '0 1.5rem 6rem', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(132,204,22,0.06) 0%, transparent 60%)',
          border: '1px solid rgba(132,204,22,0.15)',
          borderRadius: '1rem',
          padding: '2.5rem',
        }}>
          <p style={{ color: 'var(--brand-lime)', fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem' }}>
            Contract analysis
          </p>
          <h2 style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '1rem', lineHeight: 1.15 }}>
            Your responses quote your actual contract — not generic advice.
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '1rem' }}>
            Upload your signed contract once per project. Pushback reads it, scores its risk level, and maps which clauses cover payment terms, revision limits, IP, kill fees, and scope. From that point on, every response Pushback drafts for that project references your actual agreement.
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.65 }}>
            Instead of &ldquo;per standard industry practice, late fees may apply&rdquo; — your response says &ldquo;as outlined in section 4 of our agreement, late payment interest accrues at 8% per annum after 7 days.&rdquo; That&apos;s the difference.
          </p>
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div>
              <p style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>Free plan</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>1 contract analysis included</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>Pro plan</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>50 analyses/month, multiple projects</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>Privacy</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>Raw text processed, never stored</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ padding: '0 1.5rem 6rem', maxWidth: '720px', margin: '0 auto' }}>
        <h2 style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '2rem', textAlign: 'center' }}>
          Frequently asked
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {FAQS.map(({ q, a }) => (
            <div key={q} style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              borderRadius: '0.75rem',
              padding: '1.25rem 1.5rem',
            }}>
              <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>{q}</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.65 }}>{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', padding: '0 1.5rem 7rem' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1.5rem' }}>
          Stop apologizing. Start responding like a professional.
        </p>
        <Link
          href="/signup"
          style={{
            display: 'inline-block',
            backgroundColor: 'var(--brand-lime)',
            color: '#0a0a0a',
            fontWeight: 700,
            fontSize: '0.9rem',
            padding: '0.75rem 2rem',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            letterSpacing: '0.01em',
          }}
        >
          Try it free
        </Link>
        <p style={{ color: '#3f3f46', fontSize: '0.75rem', marginTop: '0.875rem' }}>No card required. 1 free response included.</p>
      </div>

      <Footer />
    </div>
  )
}
