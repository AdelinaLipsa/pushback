import Link from 'next/link'
import {
  AlertTriangle,
  FileText,
  MessageSquare,
  ShieldCheck,
  ClipboardList,
  BookOpen,
  BarChart2,
  Send,
} from 'lucide-react'

interface Moment {
  label: string
  Icon: React.ComponentType<{ size?: number; className?: string }>
  headline: string
  when: string
  tools: { name: string; href: string; helps: string }[]
}

const MOMENTS: Moment[] = [
  {
    label: 'VET',
    Icon: AlertTriangle,
    headline: 'Before you sign — scan the prospect for risk.',
    when: 'A new client emails you. You haven\'t agreed to anything yet. Something feels off.',
    tools: [
      {
        name: 'Red Flag Detector',
        href: '/red-flag',
        helps: 'Paste the prospect\'s message and get every risk flag — scope, payment, IP, timeline, client posture — graded "safe / caution / no" with reasoning.',
      },
      {
        name: 'Intake Questions',
        href: '/intake',
        helps: 'Describe the project; get a tailored list of questions to ask the client before you quote, organized by category (scope, payment, rights, timeline).',
      },
    ],
  },
  {
    label: 'SIGN',
    Icon: FileText,
    headline: 'Before you sign — analyze the contract for clauses that could cost you.',
    when: 'They sent the service agreement. You\'re about to sign.',
    tools: [
      {
        name: 'Analyze a contract',
        href: '/contracts/new',
        helps: 'Upload the PDF or paste the text. Get a 0-10 risk score, every flagged clause with severity, missing protections (late-fee, kill-fee, scope, revisions, payment schedule), and a verdict.',
      },
    ],
  },
  {
    label: 'REPLY',
    Icon: MessageSquare,
    headline: 'Mid-project — when the client gets difficult, send a prepared response.',
    when: 'They\'re asking for free work, pushing scope, going silent on payment, or threatening a chargeback.',
    tools: [
      {
        name: 'Defense Dashboard (per project)',
        href: '/projects',
        helps: 'Open the project. Paste what the client said. We identify the situation across 23 types and produce a contract-grounded reply — payment reminders, scope pushback, chargeback rebuttals, sign-off requests, and more.',
      },
      {
        name: 'Arsenal',
        href: '/arsenal',
        helps: 'Browse the full catalog of 23 reply situations grouped by category. Reference when you\'re not sure which tool fits the moment.',
      },
    ],
  },
  {
    label: 'RECOVER',
    Icon: ShieldCheck,
    headline: 'After delivery — chase late payment and defend against disputes.',
    when: 'Invoice is overdue, or the client just filed a chargeback / threatened one.',
    tools: [
      {
        name: 'Payment tracking',
        href: '/projects',
        helps: 'Set the due date on a project; we surface overdue invoices on the dashboard and suggest escalation cadence (first reminder → second → final notice).',
      },
      {
        name: 'Dispute Pack',
        href: '/projects',
        helps: 'Pro feature. Generates a Stripe/PayPal-ready 7-page PDF rebuttal — cover letter, contract excerpts, delivery timeline, communication log, sign-off proofs, payment record, summary. One click, downloadable.',
      },
    ],
  },
]

const ELSEWHERE: { name: string; href: string; Icon: React.ComponentType<{ size?: number; className?: string }>; helps: string }[] = [
  {
    name: 'Arsenal',
    href: '/arsenal',
    Icon: BookOpen,
    helps: 'Browse all 23 reply situations grouped by category.',
  },
  {
    name: 'Analytics',
    href: '/analytics',
    Icon: BarChart2,
    helps: 'Your usage + outcomes: responses sent, client win rate, contract risk distribution, monthly quota.',
  },
  {
    name: 'Feedback',
    href: '/feedback',
    Icon: Send,
    helps: 'Report a bug, request a feature, or tell us what\'s missing. We read every submission.',
  },
]

const STEPS: { number: string; title: string; body: string }[] = [
  {
    number: '01',
    title: 'Create a project',
    body: 'Each client engagement is a project. Add the client name, optional project value + due date, optional notes about the client\'s quirks.',
  },
  {
    number: '02',
    title: 'Optional — upload the contract',
    body: 'If you\'re about to sign or already have, upload the service agreement. The contract risk score + clause analysis powers smarter replies and the Dispute Pack.',
  },
  {
    number: '03',
    title: 'Use the right tool when something happens',
    body: 'Client gets difficult? Open the project, paste their message, generate a reply. The tool you need is one click away.',
  },
  {
    number: '04',
    title: 'Recover overdue payment or defend a chargeback',
    body: 'Mark the invoice received when paid. If they don\'t pay or dispute, the escalation cadence and Dispute Pack are ready.',
  },
]

const sectionEyebrow: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--text-muted)',
  margin: '0 0 0.75rem 0',
}

export default function ProductTourPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
          Product tour
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '60ch' }}>
          A 2-minute orientation. Pushback covers four moments in every client engagement —
          vet, sign, reply, recover. Each moment has dedicated tools you can reach from this
          dashboard. Here&apos;s what they do and when to use them.
        </p>
      </div>

      {/* The four moments */}
      <section className="fade-up" style={{ animationDelay: '0.05s', marginBottom: '3rem' }}>
        <p style={sectionEyebrow}>The four client moments</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {MOMENTS.map((m) => (
            <div
              key={m.label}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--bg-border)',
                borderLeft: '3px solid var(--brand-lime)',
                borderRadius: '0.75rem',
                padding: '1.25rem 1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '0.5rem',
                    backgroundColor: 'rgba(132,204,22,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <m.Icon size={18} className="text-brand-lime" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.625rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--brand-lime)' }}>
                      {m.label}
                    </span>
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {m.headline}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>When: </span>
                    {m.when}
                  </p>
                </div>
              </div>

              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {m.tools.map((t) => (
                  <li
                    key={t.name}
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 0.875rem',
                    }}
                  >
                    <Link
                      href={t.href}
                      style={{
                        color: 'var(--brand-lime)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                      className="hover:opacity-80 transition-opacity"
                    >
                      {t.name} →
                    </Link>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0.3rem 0 0 0', lineHeight: 1.5 }}>
                      {t.helps}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Getting started */}
      <section className="fade-up" style={{ animationDelay: '0.1s', marginBottom: '3rem' }}>
        <p style={sectionEyebrow}>Getting started</p>
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
            borderRadius: '0.75rem',
            padding: '1.5rem 1.75rem',
          }}
        >
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            {STEPS.map((s) => (
              <li key={s.number} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <span
                  style={{
                    fontVariantNumeric: 'tabular-nums',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: 'var(--brand-lime)',
                    letterSpacing: '0.05em',
                    flexShrink: 0,
                    marginTop: '0.15rem',
                  }}
                >
                  {s.number}
                </span>
                <div>
                  <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
                    {s.title}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--bg-border)' }}>
            <Link
              href="/projects/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                backgroundColor: 'var(--brand-lime)',
                color: '#0a0a0a',
                fontWeight: 700,
                padding: '0.6rem 1.25rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontSize: '0.9rem',
              }}
              className="hover:opacity-90 transition-opacity"
            >
              Create your first project →
            </Link>
          </div>
        </div>
      </section>

      {/* Reference */}
      <section className="fade-up" style={{ animationDelay: '0.15s', marginBottom: '2rem' }}>
        <p style={sectionEyebrow}>Elsewhere in the app</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {ELSEWHERE.map((e) => (
            <Link
              key={e.name}
              href={e.href}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--bg-border)',
                borderRadius: '0.625rem',
                padding: '1rem 1.125rem',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                transition: 'border-color 150ms ease',
              }}
              className="hover:border-zinc-600"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <e.Icon size={14} className="text-brand-lime" />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {e.name}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {e.helps}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Closer */}
      <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--bg-border)' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
          Stuck or missing something?{' '}
          <Link
            href="/feedback"
            style={{ color: 'var(--brand-lime)', textDecoration: 'none', fontWeight: 600 }}
            className="hover:opacity-80 transition-opacity"
          >
            Tell us →
          </Link>
        </p>
      </div>
    </div>
  )
}
