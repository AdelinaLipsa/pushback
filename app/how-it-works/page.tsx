import type { Metadata } from 'next'
import Link from 'next/link'
import Footer from '@/components/shared/Footer'
import FAQAccordion from '@/components/shared/FAQAccordion'
import DemoAnimation from '@/components/hero/DemoAnimation'
import ContractAnimation from '@/components/hero/ContractAnimation'
import ReplyThreadAnimation from '@/components/hero/ReplyThreadAnimation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'How It Works — Pushback',
  description: 'See how Pushback helps freelancers handle scope creep, late payments, and difficult clients with professional AI-generated responses.',
}


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

const STEPS = [
  { n: '01', title: 'Create a project', desc: 'Add client name, rate, and payment due date. The project is your command center for that client.' },
  { n: '02', title: 'Upload your contract', desc: 'Paste it in once. Pushback analyzes it and references your actual clauses in every reply.' },
  { n: '03', title: 'Paste the client message', desc: 'Pushback reads what they sent, identifies the situation, and suggests the right tool.' },
  { n: '04', title: 'Generate and send', desc: 'Confirm the tool, generate a copy-ready reply. Edit if you want, then copy and send.' },
  { n: '05', title: 'Follow through', desc: 'Mark it sent. If they push back again, paste their reply and Pushback drafts the follow-up.' },
]

export default async function HowItWorksPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        .hiw-logo:hover span:first-child { opacity: 0.75; }
        .hiw-logo span { transition: opacity 150ms ease; }

        .hiw-back {
          position: absolute;
          left: 1.5rem;
          color: var(--text-muted);
          font-size: 0.8rem;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          transition: color 150ms ease;
        }
        .hiw-back:hover { color: var(--text-primary); }

        .hiw-btn-ghost {
          display: inline-block;
          border: 1px solid var(--bg-border);
          color: var(--text-primary);
          font-weight: 600;
          font-size: 0.9rem;
          padding: 0.75rem 2rem;
          border-radius: 0.5rem;
          text-decoration: none;
          letter-spacing: 0.01em;
          transition: background-color 200ms ease, border-color 200ms ease, color 200ms ease;
        }
        .hiw-btn-ghost:hover {
          background-color: var(--brand-lime);
          border-color: var(--brand-lime);
          color: #0a0a0a;
        }

        .hiw-btn-primary {
          display: inline-block;
          background-color: var(--brand-lime);
          color: #0a0a0a;
          font-weight: 700;
          font-size: 0.9rem;
          padding: 0.75rem 2rem;
          border-radius: 0.5rem;
          text-decoration: none;
          letter-spacing: 0.01em;
          transition: opacity 150ms ease, transform 150ms ease;
        }
        .hiw-btn-primary:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }
      `}</style>
      <div className="dash-glow-a" />
      <div className="dash-glow-b" />

      {/* Logo header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1.5rem 0', position: 'relative' }}>
        {user && (
          <Link href="/dashboard" className="hiw-back">
            ← Dashboard
          </Link>
        )}
        <Link href="/" className="hiw-logo" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.1rem', textDecoration: 'none' }}>
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

      {/* Demo — full width cinematic teaser */}
      <div style={{ padding: '0 1.5rem 5rem', maxWidth: '900px', margin: '0 auto' }}>
        <DemoAnimation />
      </div>

      {/* Steps overview */}
      <div style={{ padding: '0 1.5rem 6rem', maxWidth: '680px', margin: '0 auto' }}>
        <p style={{ color: 'var(--brand-lime)', fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>
          The workflow
        </p>
        <h2 style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '2.5rem', textAlign: 'center', lineHeight: 1.1 }}>
          Five steps. Every client situation handled.
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {STEPS.map((step, i) => (
            <div key={step.n} style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', position: 'relative', paddingBottom: i < STEPS.length - 1 ? '2rem' : '0' }}>
              {/* connector line */}
              {i < STEPS.length - 1 && (
                <div style={{ position: 'absolute', left: '0.95rem', top: '2rem', bottom: '0', width: '1px', backgroundColor: 'var(--bg-border)' }} />
              )}
              <span style={{ color: 'var(--brand-lime)', fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.02em', flexShrink: 0, lineHeight: 1.4, width: '1.9rem', textAlign: 'center', position: 'relative', zIndex: 1, backgroundColor: 'var(--bg-base)', paddingTop: '0.1rem' }}>
                {step.n}
              </span>
              <div>
                <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.2rem' }}>{step.title}</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 01 — Create a project */}
      <div style={{ padding: '0 1.5rem 6rem', maxWidth: '900px', margin: '0 auto' }}>
        <p style={{ color: 'var(--brand-lime)', fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>
          Step 01
        </p>
        <h2 style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.75rem', textAlign: 'center', lineHeight: 1.1 }}>
          Create a project. Set the context once.
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '3rem', textAlign: 'center', maxWidth: '52ch', margin: '0 auto 3rem' }}>
          Add a project for each client engagement — client name, rate, and payment due date. That&apos;s your command center: every response, contract, and escalation document lives under it.
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
              <div style={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: '#84cc16', flexShrink: 0 }} />
              <p style={{ color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 700 }}>Everything in one place</p>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.6 }}>Responses, contract analysis, documents, and client risk tracking all live under the same project — no hunting across tabs.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: '#ef4444', flexShrink: 0 }} />
              <p style={{ color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 700 }}>Payment tracking built in</p>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.6 }}>Set a payment due date and Pushback tracks it. Overdue invoices surface as red alerts on your dashboard with the exact number of days late.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: '#f59e0b', flexShrink: 0 }} />
              <p style={{ color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 700 }}>Needs attention dashboard</p>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.6 }}>Overdue payments, ghost clients, and stalled situations surface automatically — each one pre-loaded with the right tool to handle it.</p>
          </div>
        </div>
      </div>

      {/* Step 02 — Upload your contract */}
      <div style={{ padding: '0 1.5rem 6rem', maxWidth: '900px', margin: '0 auto' }}>
        <p style={{ color: 'var(--brand-lime)', fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>
          Step 02
        </p>
        <h2 style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.75rem', textAlign: 'center', lineHeight: 1.1 }}>
          Upload your contract. Every reply becomes clause-specific.
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '3rem', textAlign: 'center', maxWidth: '52ch', margin: '0 auto 3rem' }}>
          Paste your contract once and Pushback analyzes it — flagging risky clauses and surfacing what&apos;s missing. From that point on, every response references your actual payment terms, revision limits, and kill fee, not generic advice.
        </p>
        <ContractAnimation />
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>Optional but powerful</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>No contract? Pushback still works — replies just use best-practice language instead of your specific terms.</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>Free plan</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>1 contract analysis included</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>Privacy</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>Raw text processed, never stored</p>
          </div>
        </div>
      </div>

      {/* Step 03 — Paste the message */}
      <div style={{ padding: '0 1.5rem 6rem', maxWidth: '900px', margin: '0 auto' }}>
        <p style={{ color: 'var(--brand-lime)', fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>
          Step 03
        </p>
        <h2 style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.75rem', textAlign: 'center', lineHeight: 1.1 }}>
          Paste what they sent. Pushback reads the situation.
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '3rem', textAlign: 'center', maxWidth: '52ch', margin: '0 auto 3rem' }}>
          Go to your project, paste the client message. Pushback identifies what&apos;s happening — scope creep, payment pressure, a dispute threat — and surfaces the right tool. You can accept the suggestion or pick a different one from the sidebar.
        </p>
        <style>{`
          .hiw-stat-card {
            background: var(--bg-surface);
            border: 1px solid var(--bg-border);
            border-radius: 0.875rem;
            padding: 1.75rem 1.75rem;
            position: relative;
            overflow: hidden;
            transition: border-color 200ms ease, box-shadow 200ms ease, background-color 200ms ease;
          }
          .hiw-stat-card::before {
            content: '';
            position: absolute;
            top: 0; right: 0;
            width: 130px; height: 130px;
            background: radial-gradient(circle at 100% 0%, rgba(132,204,22,0.13) 0%, transparent 70%);
            opacity: 0;
            transition: opacity 200ms ease;
            pointer-events: none;
          }
          .hiw-stat-card:hover {
            border-color: rgba(132,204,22,0.28);
            box-shadow: 0 0 40px rgba(132,204,22,0.07), inset 0 1px 0 rgba(132,204,22,0.1);
            background-color: var(--bg-elevated);
          }
          .hiw-stat-card:hover::before { opacity: 1; }
        `}</style>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
          <div className="hiw-stat-card">
            <p style={{ color: 'var(--brand-lime)', fontFamily: 'var(--font-mono)', fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '0.3rem' }}>21</p>
            <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem' }}>Defense tools</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.6 }}>Situation-specific, not generic. Payment, scope, disputes, client behaviour — each tool is built for exactly one problem.</p>
          </div>
          <div className="hiw-stat-card">
            <p style={{ color: 'var(--brand-lime)', fontFamily: 'var(--font-mono)', fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '0.3rem' }}>Auto</p>
            <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem' }}>Situation detection</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.6 }}>Paste the message and Pushback identifies what you&apos;re dealing with. Override at any time — you always have the final call.</p>
          </div>
          <div className="hiw-stat-card">
            <p style={{ color: 'var(--brand-lime)', fontFamily: 'var(--font-mono)', fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '0.3rem' }}>&lt;30s</p>
            <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem' }}>To a copy-ready reply</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.6 }}>Paste, detect, generate, copy. Start to finish in under 30 seconds.</p>
          </div>
        </div>
      </div>

      {/* Step 04 — Generate and send */}
      <div style={{ padding: '0 1.5rem 6rem', maxWidth: '900px', margin: '0 auto' }}>
        <p style={{ color: 'var(--brand-lime)', fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>
          Step 04
        </p>
        <h2 style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.75rem', textAlign: 'center', lineHeight: 1.1 }}>
          Generate. Edit if you want. Send.
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '3rem', textAlign: 'center', maxWidth: '52ch', margin: '0 auto 3rem' }}>
          Hit generate. Pushback drafts a firm, professional reply that references your actual contract terms — not generic advice. Edit it to match your voice, or send it exactly as written. Mark it sent to keep your history clean.
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
              <div style={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: '#84cc16', flexShrink: 0 }} />
              <p style={{ color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 700 }}>Clause-aware output</p>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.6 }}>Every response references your actual payment terms, revision limits, and kill fee clause — not boilerplate language.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: '#a78bfa', flexShrink: 0 }} />
              <p style={{ color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 700 }}>Fully editable</p>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.6 }}>The output is a starting point, not a final draft unless you want it to be. Edit the tone, trim it down, or send exactly as generated.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: '#f59e0b', flexShrink: 0 }} />
              <p style={{ color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 700 }}>Sent tracking</p>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.6 }}>Mark a response as sent and Pushback uses that to calibrate escalation timing — knowing when to suggest the next step.</p>
          </div>
        </div>
      </div>

      {/* Step 05 — Follow through */}
      <div style={{ padding: '0 1.5rem 6rem', maxWidth: '900px', margin: '0 auto' }}>
        <p style={{ color: 'var(--brand-lime)', fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>
          Step 05
        </p>
        <h2 style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.75rem', textAlign: 'center', lineHeight: 1.1 }}>
          Client pushes back? Thread it. Escalate if needed.
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '3rem', textAlign: 'center', maxWidth: '52ch', margin: '0 auto 3rem' }}>
          Paste their reply into your project history. Pushback reads their stance — backing down, doubling down, or escalating — and drafts the right follow-up. If it goes further, generate a formal document that makes your position airtight.
        </p>
        <ReplyThreadAnimation />
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '3rem' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>4 stances detected</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>Backing down, doubling down, escalating, unclear</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>Stays in your history</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>Thread analysis lives on the response — no separate tab or page</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>Pro feature</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>Uses the same credit pool as response generation</p>
          </div>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center', marginBottom: '1.5rem' }}>
          When a reply isn&apos;t enough — generate a formal document.
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

      {/* Arsenal link */}
      <div style={{ padding: '0 1.5rem 6rem', maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
        <p style={{ color: 'var(--brand-lime)', fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem' }}>
          The arsenal
        </p>
        <h2 style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.75rem', lineHeight: 1.1 }}>
          21 tools. Every client nightmare covered.
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '2rem', maxWidth: '48ch', margin: '0 auto 2rem' }}>
          Payment chasing, scope disputes, chargeback threats, ghost clients — each situation has its own tool, built for that exact dynamic. Browse the full list to see what fits your situation.
        </p>
        <Link href="/arsenal" className="hiw-btn-ghost">
          Browse the arsenal →
        </Link>
      </div>

      {/* FAQ */}
      <div style={{ padding: '0 1.5rem 6rem', maxWidth: '720px', margin: '0 auto' }}>
<p style={{ color: 'var(--brand-lime)', fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>
          FAQ
        </p>
        <h2 style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '2rem', textAlign: 'center' }}>
          Frequently asked
        </h2>
        <FAQAccordion items={FAQS} />
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', padding: '0 1.5rem 7rem' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1.5rem' }}>
          Your next client situation is coming. Have the reply ready.
        </p>
        <Link href="/signup" className="hiw-btn-primary">
          Try it free
        </Link>
        <p style={{ color: '#3f3f46', fontSize: '0.75rem', marginTop: '0.875rem' }}>No card required. 1 free response included.</p>
      </div>

      <Footer />
    </div>
  )
}
