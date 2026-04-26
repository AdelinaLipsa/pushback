import type { Metadata } from 'next'
import Link from 'next/link'
import { DEFENSE_TOOLS } from '@/lib/defenseTools'

export const metadata: Metadata = {
  title: 'How It Works — Pushback',
  description: 'See how Pushback helps freelancers handle scope creep, late payments, and difficult clients with professional AI-generated responses.',
}
import Footer from '@/components/shared/Footer'
import DemoAnimation from '@/components/hero/DemoAnimation'
import ContractAnimation from '@/components/hero/ContractAnimation'
import ReplyThreadAnimation from '@/components/hero/ReplyThreadAnimation'

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


const FAQS = [
  {
    q: 'How many responses can I generate on the free plan?',
    a: '1 AI-generated response and 1 contract analysis — enough to try the full flow end-to-end. Pro accounts get 150 responses and 50 contract analyses per month.',
  },
  {
    q: 'How is this different from asking ChatGPT?',
    a: 'Pushback has 21 situation-specific tools built for client disputes — not a general-purpose chat. It knows your contract, tracks your project history, and drafts responses that reference your actual terms. The output is copy-ready, not a draft you need to rewrite.',
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
  {
    q: 'How does payment tracking work?',
    a: 'Add a payment due date to any project. Pushback tracks it and surfaces overdue invoices as alerts on your dashboard — with the exact number of days past due and a direct link to the right follow-up tool. No manual chasing required.',
  },
  {
    q: 'What documents can Pushback generate?',
    a: 'Three: an SOW amendment (when scope changes mid-project), a dispute package (when a client escalates or threatens a chargeback), and a kill fee invoice (when a client cancels after work has started). Each pulls your project details and contract terms automatically. Document generation is a Pro feature.',
  },
]

export default function HowItWorksPage() {
  return (
    <div style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div className="dash-glow-a" />
      <div className="dash-glow-b" />

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
          Paste the message. Pushback identifies what&apos;s happening, picks the right tool, and drafts a firm reply — referencing your actual contract clauses, payment terms, and revision limits.
        </p>
      </div>

      {/* DEMO — full width cinematic */}
      <div style={{ padding: '0 1.5rem 6rem', maxWidth: '900px', margin: '0 auto' }}>
        <DemoAnimation />
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
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>Output is copy-ready. Edit to match your voice, or send exactly as drafted.</p>
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

      {/* Payment tracking */}
      <div style={{ padding: '0 1.5rem 6rem', maxWidth: '900px', margin: '0 auto' }}>
        <p style={{ color: 'var(--brand-lime)', fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>
          Payment visibility
        </p>
        <h2 style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.75rem', textAlign: 'center', lineHeight: 1.1 }}>
          Know who owes you before you have to ask.
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '3rem', textAlign: 'center', maxWidth: '52ch', margin: '0 auto 3rem' }}>
          Add a payment due date to any project. Pushback tracks it, flags overdue invoices on your dashboard, and pre-loads the right follow-up tool — so you never have to manually chase a late payment.
        </p>
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--bg-border)',
          borderRadius: '1rem',
          padding: '2rem 2.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '2rem',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: '#ef4444', flexShrink: 0 }} />
              <p style={{ color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 700 }}>Overdue badge</p>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.6 }}>Past-due invoices surface as a red alert on your dashboard — with the exact number of days overdue so nothing slips through.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: '#f59e0b', flexShrink: 0 }} />
              <p style={{ color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 700 }}>Due soon warning</p>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.6 }}>Invoices within 3 days of their due date get an amber warning — get ahead of it before it tips into overdue.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: '#84cc16', flexShrink: 0 }} />
              <p style={{ color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 700 }}>One-click follow-up</p>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.6 }}>Click any overdue alert and Pushback pre-selects the right reminder tool for the stage you&apos;re at — first notice, second chase, or final warning.</p>
          </div>
        </div>
      </div>

      {/* Contract analysis */}
      <div style={{ padding: '0 1.5rem 6rem', maxWidth: '900px', margin: '0 auto' }}>
        <p style={{ color: 'var(--brand-lime)', fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>
          Contract analysis
        </p>
        <h2 style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.75rem', textAlign: 'center', lineHeight: 1.1 }}>
          Know what you&apos;re signing before you sign it.
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '3rem', textAlign: 'center', maxWidth: '52ch', margin: '0 auto 3rem' }}>
          Upload your contract once. Pushback flags risky clauses, surfaces what&apos;s missing, and tells you exactly what to say back — so every response references your actual agreement, not generic advice.
        </p>
        <ContractAnimation />
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>Free plan</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>1 contract analysis included</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>Pro plan</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>50 analyses/month, multiple projects</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>Privacy</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>Raw text processed, never stored</p>
          </div>
        </div>
      </div>

      {/* Reply threading */}
      <div style={{ padding: '0 1.5rem 6rem', maxWidth: '900px', margin: '0 auto' }}>
        <p style={{ color: 'var(--brand-lime)', fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>
          Reply threading
        </p>
        <h2 style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.75rem', textAlign: 'center', lineHeight: 1.1 }}>
          Client replies back? Know exactly where you stand.
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '3rem', textAlign: 'center', maxWidth: '52ch', margin: '0 auto 3rem' }}>
          Paste their reply into the history page. Pushback reads their stance — backing down, doubling down, or escalating — and drafts the right follow-up message so you never lose the thread.
        </p>
        <ReplyThreadAnimation />
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>4 stances detected</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>Backing down, doubling down, escalating, unclear</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>One reply per thread</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>Analysis lives in your message history — no separate tab</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>Pro feature</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>Uses the same credit pool as response generation</p>
          </div>
        </div>
      </div>

      {/* Document generation */}
      <div style={{ padding: '0 1.5rem 6rem', maxWidth: '900px', margin: '0 auto' }}>
        <p style={{ color: 'var(--brand-lime)', fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>
          Document generation
        </p>
        <h2 style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.75rem', textAlign: 'center', lineHeight: 1.1 }}>
          Not just a reply. A full paper trail.
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '3rem', textAlign: 'center', maxWidth: '52ch', margin: '0 auto 3rem' }}>
          When words aren&apos;t enough, generate a formal document. Each one pulls your project details and contract terms automatically — ready to send or attach.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {[
            {
              label: 'SOW Amendment',
              color: '#f59e0b',
              desc: 'Scope changed mid-project? Generate a formal amendment that documents the new deliverables, revised timeline, and updated fee — and gets both parties back on the same page in writing.',
            },
            {
              label: 'Dispute Package',
              color: '#ef4444',
              desc: 'Client escalating or threatening a chargeback? Compile a dispute package with your original agreement, all communications, and a formal record of what was delivered — ready to send or escalate.',
            },
            {
              label: 'Kill Fee Invoice',
              color: '#84cc16',
              desc: 'Client cancelled after work started? Generate a kill fee invoice that references the cancellation clause in your contract and the work completed to date — no awkward back-and-forth.',
            },
          ].map(doc => (
            <div key={doc.label} style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              borderRadius: '0.875rem',
              padding: '1.75rem 2rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: doc.color, flexShrink: 0 }} />
                <p style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 700 }}>{doc.label}</p>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.65 }}>{doc.desc}</p>
            </div>
          ))}
        </div>
        <p style={{ color: '#3f3f46', fontSize: '0.75rem', textAlign: 'center', marginTop: '1.5rem' }}>Pro feature — uses the same credit pool as response generation</p>
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
