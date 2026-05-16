import type { Metadata } from 'next'
import Link from 'next/link'
import Footer from '@/components/shared/Footer'
import FAQAccordion from '@/components/shared/FAQAccordion'
import DemoAnimation from '@/components/hero/DemoAnimation'
import ContractAnimation from '@/components/hero/ContractAnimation'
import ReplyThreadAnimation from '@/components/hero/ReplyThreadAnimation'
import VetTeaser from '@/components/how-it-works/VetTeaser'
import RecoverTeaser from '@/components/how-it-works/RecoverTeaser'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ShieldCheck, FileSearch, MessageSquareWarning, BanknoteArrowDown } from 'lucide-react'

export const metadata: Metadata = {
  title: 'How it works — Pushback',
  description: 'Pushback is four connected tools for difficult clients — vet prospects before you sign, analyze contracts for hidden risk, reply with prepared playbooks, recover overdue payments. Here is exactly how each tool works, step by step.',
}

const FAQS = [
  {
    q: "Is this just an AI email writer?",
    a: 'No. Pushback is four tools: prospect vetting (red-flag detection), contract analysis (clause-by-clause risk scoring), reply playbooks (23 prepared situation tools), and payment recovery (overdue tracking + risk scoring + dispute documents). Reply playbooks are one of the four. The differentiating depth is the contract analysis and the deterministic risk engine — both built on real algorithms, not LLM prompts.',
  },
  {
    q: 'How is this different from asking ChatGPT?',
    a: 'ChatGPT does not read your contract, score your client risk, track your overdue invoices, or know your project history. Pushback does all four. When you generate a reply, it references your actual contract clauses. When you check a prospect, it uses a structured red-flag taxonomy built specifically for freelancers. ChatGPT is a generalist; Pushback is the specialist.',
  },
  {
    q: 'Where do my client messages and contracts go?',
    a: 'Pushback sends them to Anthropic (Claude) as a data processor. Anthropic does not retain your content for training. Raw contract text is read, analyzed, and discarded — only the structured analysis is stored on your account. See our privacy policy for the full data flow.',
  },
  {
    q: 'How many things can I do on the free plan?',
    a: '3 AI responses to test the reply playbooks. The free public red-flag scanner at /scan is separate — 3 scans per IP per 24 hours with no signup. Pro accounts get 10 AI responses, 50 contract analyses, document generation, reply threading, and the full risk engine.',
  },
  {
    q: 'Is the AI output legal advice?',
    a: 'No. Pushback drafts professional, ready-to-send responses based on your situation and contract. It is not a substitute for a lawyer. For high-stakes disputes, escalate to a qualified professional.',
  },
  {
    q: 'How does the risk engine work?',
    a: 'It is deterministic, not LLM-based. Three independent dimensions (payment, scope, chargeback) each derive from at least three independent signals already in your data: overdue payment history, contract clause coverage, sent defense responses by type. Each signal contributes a fixed point value. Composite score and recommended next action are computed from a static decision table — same inputs always yield the same score. Auditable per signal.',
  },
  {
    q: 'Can I cancel my Pro subscription anytime?',
    a: 'Yes — from the billing portal in your account settings. You keep Pro access until the end of the current billing period. 30-day money-back guarantee on the first month if it does not earn its keep.',
  },
  {
    q: 'What if Pushback identifies the wrong situation?',
    a: 'You override it. Every suggestion is editable — you pick a different tool from the sidebar, you edit every generated response before sending, and you choose whether to mark it sent. Pushback drafts; you decide.',
  },
]

const PILLARS = [
  { key: 'vet', code: '01', Icon: ShieldCheck, label: 'Vet', sub: 'Before you reply' },
  { key: 'sign', code: '02', Icon: FileSearch, label: 'Sign', sub: 'Before you commit' },
  { key: 'reply', code: '03', Icon: MessageSquareWarning, label: 'Reply', sub: 'When they push back' },
  { key: 'recover', code: '04', Icon: BanknoteArrowDown, label: 'Recover', sub: 'When they ghost or escalate' },
] as const

export default async function HowItWorksPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <style>{`
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
          font-size: 0.88rem;
          padding: 0.7rem 1.5rem;
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
          font-size: 0.88rem;
          padding: 0.7rem 1.5rem;
          border-radius: 0.5rem;
          text-decoration: none;
          letter-spacing: -0.01em;
          transition: opacity 150ms ease, transform 150ms ease;
        }
        .hiw-btn-primary:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }
        .pillar-step {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          padding: 0.75rem 0;
        }
        .pillar-step-num {
          flex-shrink: 0;
          width: 1.75rem;
          height: 1.75rem;
          border-radius: 50%;
          background: rgba(132,204,22,0.12);
          border: 1px solid rgba(132,204,22,0.35);
          color: var(--brand-lime);
          font-size: 0.78rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-mono);
        }
        .pillar-step-body {
          flex: 1;
          padding-top: 0.1rem;
        }
        .pillar-step-title {
          color: var(--text-primary);
          font-size: 0.92rem;
          font-weight: 600;
          margin-bottom: 0.15rem;
          letter-spacing: -0.01em;
        }
        .pillar-step-desc {
          color: var(--text-secondary);
          font-size: 0.85rem;
          line-height: 1.6;
        }
        .pillar-step-desc strong { color: var(--text-primary); font-weight: 600; }
        .pillar-step-desc code {
          background: rgba(132,204,22,0.08);
          padding: 0.1rem 0.35rem;
          border-radius: 3px;
          color: var(--brand-lime);
          font-size: 0.78rem;
          font-family: var(--font-mono);
        }
        .pain-quote {
          background: rgba(239,68,68,0.04);
          border-left: 3px solid rgba(239,68,68,0.4);
          padding: 0.85rem 1.1rem;
          border-radius: 0 0.5rem 0.5rem 0;
          color: var(--text-secondary);
          font-size: 0.92rem;
          line-height: 1.6;
          font-style: italic;
          margin-bottom: 1.5rem;
        }
        .outcome-box {
          margin-top: 1.5rem;
          background: rgba(132,204,22,0.05);
          border: 1px solid rgba(132,204,22,0.18);
          border-radius: 0.55rem;
          padding: 0.85rem 1.1rem;
          color: var(--text-secondary);
          font-size: 0.88rem;
          line-height: 1.6;
        }
        .outcome-box strong { color: var(--brand-lime); font-weight: 700; }
        .pillar-section { padding: 5rem 1.5rem; border-top: 1px solid var(--bg-border); }
        .pillar-section:first-of-type { border-top: none; }
        .pillar-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--brand-lime);
          font-size: 0.62rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 1rem;
          font-family: var(--font-mono);
        }
        .pillar-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
          max-width: 1100px;
          margin: 0 auto;
        }
        @media (min-width: 900px) {
          .pillar-grid { grid-template-columns: 1fr 1fr; gap: 4rem; align-items: start; }
        }
      `}</style>

      {/* Logo header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem 0', position: 'relative' }}>
        {user && (
          <Link href="/dashboard" className="hiw-back">
            ← Dashboard
          </Link>
        )}
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.1rem', textDecoration: 'none' }}>
          <span style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Pushback</span>
          <span style={{ color: 'var(--brand-lime)', fontWeight: 800, fontSize: '1.4rem' }}>.</span>
        </Link>
      </div>

      {/* Hero */}
      <header style={{ textAlign: 'center', padding: '3.5rem 1.5rem 2.5rem', maxWidth: '760px', margin: '0 auto' }}>
        <p style={{ color: 'var(--brand-lime)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1.25rem', fontFamily: 'var(--font-mono)' }}>
          How it works
        </p>
        <h1 style={{ color: 'var(--text-primary)', fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: '1.25rem' }}>
          Four tools. One difficult client.<br />Here&apos;s exactly what each does.
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.7, maxWidth: '58ch', margin: '0 auto' }}>
          Pushback isn&apos;t an AI email writer. It&apos;s the operating system for handling client risk across four moments — before you sign, during the work, when they push back, and after they ghost. Each tool covers one moment. Together they cover all of them.
        </p>
      </header>

      {/* Pillar map — 4-step compass */}
      <section style={{ padding: '1rem 1.5rem 5rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '0.875rem',
        }}>
          {PILLARS.map(({ key, code, Icon, label, sub }) => (
            <a
              key={key}
              href={`#${key}`}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--bg-border)',
                borderRadius: '0.75rem',
                padding: '1.25rem 1.25rem',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.625rem',
                transition: 'border-color 200ms ease, background-color 200ms ease',
              }}
              className="hover:border-lime hover:bg-elevated"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Icon size={18} style={{ color: 'var(--brand-lime)' }} aria-hidden />
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.6rem', letterSpacing: '0.1em', fontWeight: 700 }}>{code}</span>
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: '0.18rem' }}>{label}</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{sub}</p>
              </div>
            </a>
          ))}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'center', marginTop: '1.5rem' }}>
          Scroll down to see each tool, step by step — or jump to any one.
        </p>
      </section>

      {/* ───────────────────────── PILLAR 01 — VET ───────────────────────── */}
      <section id="vet" className="pillar-section">
        <div className="pillar-grid">
          <div>
            <p className="pillar-eyebrow">
              <span style={{ fontFamily: 'var(--font-mono)' }}>01</span>
              <ShieldCheck size={12} />
              VET — Before you reply
            </p>
            <h2 style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.7rem, 3.5vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '1.25rem' }}>
              Spot the bad client before you say yes.
            </h2>
            <p className="pain-quote">
              &ldquo;Hi! We&apos;re a pre-revenue startup, budget is flexible, need it in 2 weeks. Can you send some sample work first so we can decide?&rdquo; — every freelancer&apos;s inbox, every week.
            </p>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '0.5rem' }}>How it works</h3>
            <div>
              <div className="pillar-step">
                <span className="pillar-step-num">1</span>
                <div className="pillar-step-body">
                  <p className="pillar-step-title">Paste their first message</p>
                  <p className="pillar-step-desc">Go to <code>/red-flag</code> in the dashboard. Paste a prospect&apos;s email, LinkedIn DM, project brief — anything they sent before you commit.</p>
                </div>
              </div>
              <div className="pillar-step">
                <span className="pillar-step-num">2</span>
                <div className="pillar-step-body">
                  <p className="pillar-step-title">Pushback scans for warning patterns</p>
                  <p className="pillar-step-desc">Budget deflection, scope vagueness, IP grabs, spec-work asks, decision-maker ambiguity, urgency manipulation, ghosting signals — each flagged with a severity rating from <strong>critical</strong> down to <strong>low</strong>.</p>
                </div>
              </div>
              <div className="pillar-step">
                <span className="pillar-step-num">3</span>
                <div className="pillar-step-body">
                  <p className="pillar-step-title">Get the exact question to ask back</p>
                  <p className="pillar-step-desc">Each flag comes with a question to ask before agreeing — designed to surface the truth without sounding combative. Plus a verdict: <strong>Safe to proceed</strong>, <strong>proceed with caution</strong>, or <strong>do not accept</strong>.</p>
                </div>
              </div>
            </div>
            <div className="outcome-box">
              <strong>Outcome:</strong> You either negotiate from a stronger position — or walk away with a clear, articulable reason why.
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.75rem' }}>
              <Link href="/scan" className="hiw-btn-primary">Try it free — no signup →</Link>
              <Link href="/signup" className="hiw-btn-ghost">Get the full tool</Link>
            </div>
          </div>
          <div>
            <VetTeaser />
          </div>
        </div>
      </section>

      {/* ───────────────────────── PILLAR 02 — SIGN ───────────────────────── */}
      <section id="sign" className="pillar-section">
        <div className="pillar-grid">
          <div>
            <p className="pillar-eyebrow">
              <span style={{ fontFamily: 'var(--font-mono)' }}>02</span>
              <FileSearch size={12} />
              SIGN — Before you commit
            </p>
            <h2 style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.7rem, 3.5vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '1.25rem' }}>
              Read a contract like a lawyer — without paying one.
            </h2>
            <p className="pain-quote">
              &ldquo;The contract they sent is 12 pages of legalese. There&apos;s definitely something in there I should push back on. Lawyer review is €400/hour and the project is only €3,000.&rdquo;
            </p>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '0.5rem' }}>How it works</h3>
            <div>
              <div className="pillar-step">
                <span className="pillar-step-num">1</span>
                <div className="pillar-step-body">
                  <p className="pillar-step-title">Upload the contract</p>
                  <p className="pillar-step-desc">PDF upload or paste the text into <code>/contracts/new</code>. Most freelance contracts are 4–10 pages — Pushback handles both.</p>
                </div>
              </div>
              <div className="pillar-step">
                <span className="pillar-step-num">2</span>
                <div className="pillar-step-body">
                  <p className="pillar-step-title">Pushback scores it clause by clause</p>
                  <p className="pillar-step-desc">A risk score from 0–10 overall, plus per-clause analysis. You see what&apos;s <strong>present</strong> (scope, payment terms, kill fee, IP transfer), what&apos;s <strong>risky</strong> (unlimited revisions, vague acceptance), and what&apos;s <strong>missing</strong> (no late fee clause, no cancellation terms).</p>
                </div>
              </div>
              <div className="pillar-step">
                <span className="pillar-step-num">3</span>
                <div className="pillar-step-body">
                  <p className="pillar-step-title">Get a counter-offer email — Pro</p>
                  <p className="pillar-step-desc">Pushback drafts the exact email to send back: which clauses to redline, what language to add, and the professional framing that makes the asks feel reasonable. Copy and send.</p>
                </div>
              </div>
            </div>
            <div className="outcome-box">
              <strong>Outcome:</strong> You sign with eyes open. Or you push back on the right clauses before signing — not three months in when they bite you.
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '1.5rem' }}>
              Free plan: contract analysis on the free tier was retired so it could be a real, useful Pro feature. Pro: 50 analyses/month.
            </p>
          </div>
          <div>
            <ContractAnimation />
          </div>
        </div>
      </section>

      {/* ───────────────────────── PILLAR 03 — REPLY ───────────────────────── */}
      <section id="reply" className="pillar-section">
        <div className="pillar-grid">
          <div>
            <p className="pillar-eyebrow">
              <span style={{ fontFamily: 'var(--font-mono)' }}>03</span>
              <MessageSquareWarning size={12} />
              REPLY — When they push back
            </p>
            <h2 style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.7rem, 3.5vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '1.25rem' }}>
              The right reply, ready before you&apos;ve finished reading their message.
            </h2>
            <p className="pain-quote">
              &ldquo;They want a &lsquo;small&rsquo; addition. Or to delay the payment date. Or they&apos;re going quiet. Or they want to renegotiate the rate three weeks in. I rewrite the same firm-but-friendly email every time.&rdquo;
            </p>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '0.5rem' }}>How it works</h3>
            <div>
              <div className="pillar-step">
                <span className="pillar-step-num">1</span>
                <div className="pillar-step-body">
                  <p className="pillar-step-title">Paste what they sent</p>
                  <p className="pillar-step-desc">Inside the project, paste the client message. Pushback reads it and identifies which of the <strong>23 situations</strong> you&apos;re dealing with: scope change, payment chase, chargeback threat, IP dispute, ghosting, rate pressure, and 17 more.</p>
                </div>
              </div>
              <div className="pillar-step">
                <span className="pillar-step-num">2</span>
                <div className="pillar-step-body">
                  <p className="pillar-step-title">Confirm the tool or override</p>
                  <p className="pillar-step-desc">Accept the suggestion, or pick a different tool from the sidebar. You always have the final call — Pushback drafts; you decide.</p>
                </div>
              </div>
              <div className="pillar-step">
                <span className="pillar-step-num">3</span>
                <div className="pillar-step-body">
                  <p className="pillar-step-title">Generate a contract-grounded reply</p>
                  <p className="pillar-step-desc">The draft references your actual contract — your revision cap, your payment terms, your kill fee clause. Not generic advice. Edit if you want, copy, send. Then mark it sent so Pushback can calibrate the next escalation.</p>
                </div>
              </div>
              <div className="pillar-step">
                <span className="pillar-step-num">4</span>
                <div className="pillar-step-body">
                  <p className="pillar-step-title">When they reply — Pro</p>
                  <p className="pillar-step-desc">Paste their response. Pushback reads their stance — <strong>backing down</strong>, <strong>doubling down</strong>, <strong>escalating</strong>, or <strong>unclear</strong> — and drafts the follow-up calibrated to where the conversation actually is.</p>
                </div>
              </div>
            </div>
            <div className="outcome-box">
              <strong>Outcome:</strong> Firm, professional, contract-grounded reply in 30 seconds — not 30 minutes of agonizing over wording.
            </div>
            <div style={{ marginTop: '1.5rem' }}>
              <Link href="/arsenal" className="hiw-btn-ghost">Browse all 23 tools →</Link>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '0.75rem' }}>
                Paste a message → get a reply
              </p>
              <DemoAnimation />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '0.75rem' }}>
                Their reply → calibrated follow-up (Pro)
              </p>
              <ReplyThreadAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── PILLAR 04 — RECOVER ───────────────────────── */}
      <section id="recover" className="pillar-section">
        <div className="pillar-grid">
          <div>
            <p className="pillar-eyebrow">
              <span style={{ fontFamily: 'var(--font-mono)' }}>04</span>
              <BanknoteArrowDown size={12} />
              RECOVER — When they ghost or escalate
            </p>
            <h2 style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.7rem, 3.5vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '1.25rem' }}>
              Make the cost of ignoring you higher than paying you.
            </h2>
            <p className="pain-quote">
              &ldquo;Invoice is 18 days overdue. Two reminders, no response. They&apos;re threatening a chargeback. I don&apos;t know what document to send next, or whether I have a case.&rdquo;
            </p>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '0.5rem' }}>How it works</h3>
            <div>
              <div className="pillar-step">
                <span className="pillar-step-num">1</span>
                <div className="pillar-step-body">
                  <p className="pillar-step-title">Overdue invoices flag themselves</p>
                  <p className="pillar-step-desc">Set a payment due date when you create the project. Pushback watches it. Overdue invoices surface on your dashboard with <strong>exact days late</strong> and the right follow-up tool already pre-loaded.</p>
                </div>
              </div>
              <div className="pillar-step">
                <span className="pillar-step-num">2</span>
                <div className="pillar-step-body">
                  <p className="pillar-step-title">Risk Engine scores the client</p>
                  <p className="pillar-step-desc">A deterministic engine scores each client 0–100 across three dimensions: <strong>payment risk</strong>, <strong>scope risk</strong>, and <strong>chargeback risk</strong>. Each score breaks down per signal — you can audit exactly why it&apos;s red.</p>
                </div>
              </div>
              <div className="pillar-step">
                <span className="pillar-step-num">3</span>
                <div className="pillar-step-body">
                  <p className="pillar-step-title">Get the single highest-leverage move</p>
                  <p className="pillar-step-desc">The engine simulates which single mitigation would drop the score most — e.g. <em>&ldquo;Get sign-off on Milestone 3 — chargeback risk drops 22 points.&rdquo;</em> Not a wall of advice; one move.</p>
                </div>
              </div>
              <div className="pillar-step">
                <span className="pillar-step-num">4</span>
                <div className="pillar-step-body">
                  <p className="pillar-step-title">Generate the formal document — Pro</p>
                  <p className="pillar-step-desc">Three documents: <strong>SOW Amendment</strong> (mid-project scope change), <strong>Dispute Package</strong> (chargeback rebuttal), <strong>Kill Fee Invoice</strong> (cancelled-after-start). Each references your contract terms and project history automatically.</p>
                </div>
              </div>
            </div>
            <div className="outcome-box">
              <strong>Outcome:</strong> You have leverage and paperwork. They have a deadline and consequences. The conversation moves from negotiation to enforcement.
            </div>
          </div>
          <div>
            <RecoverTeaser />
          </div>
        </div>
      </section>

      {/* What Pushback is NOT */}
      <section style={{ padding: '5rem 1.5rem', borderTop: '1px solid var(--bg-border)', backgroundColor: 'var(--bg-surface)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem', fontFamily: 'var(--font-mono)' }}>
            What Pushback is not
          </p>
          <h2 style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.5rem, 3vw, 2.1rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '2rem', lineHeight: 1.1 }}>
            Three things to clear up.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', textAlign: 'left' }}>
            {[
              { title: 'Not an AI email writer.', body: 'Reply playbooks are one of four tools. The differentiating depth is contract analysis and the risk engine — both built on real algorithms, not LLM prompts.' },
              { title: 'Not legal advice.', body: 'Pushback drafts ready-to-send professional responses. For high-stakes disputes, escalate to a qualified lawyer.' },
              { title: 'Not a CRM.', body: 'It does not track leads, manage pipelines, or send invoices. It handles the moments when a client is being difficult — and only those moments.' },
            ].map(item => (
              <div key={item.title} style={{
                backgroundColor: 'var(--bg-base)',
                border: '1px solid var(--bg-border)',
                borderRadius: '0.65rem',
                padding: '1.25rem 1.25rem',
              }}>
                <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.4rem' }}>{item.title}</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.6 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '5rem 1.5rem', borderTop: '1px solid var(--bg-border)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <p style={{ color: 'var(--brand-lime)', fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
            FAQ
          </p>
          <h2 style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '2rem', textAlign: 'center' }}>
            Frequently asked
          </h2>
          <FAQAccordion items={FAQS} />
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: 'center', padding: '4rem 1.5rem 6rem' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '1.5rem', maxWidth: '50ch', margin: '0 auto 1.5rem' }}>
          Your next difficult-client moment is coming. Have the right tool ready.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/signup" className="hiw-btn-primary">Try it free →</Link>
          <Link href="/scan" className="hiw-btn-ghost">Or scan a prospect — no signup</Link>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '1rem' }}>No card required. 3 free AI responses included.</p>
      </section>

      <Footer />
    </div>
  )
}
