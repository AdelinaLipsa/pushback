import Link from 'next/link'
import {
  AlertTriangle,
  FileText,
  MessageSquare,
  ShieldCheck,
  BookOpen,
  BarChart2,
  Send,
  ClipboardList,
  ArrowUpRight,
  Flag,
  Scan,
  Receipt,
  ScrollText,
  Compass,
} from 'lucide-react'
import ScrollReveal from '@/components/shared/ScrollReveal'

type IconType = React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>

interface Tool {
  name: string
  href: string
  helps: string
  Icon: IconType
}

interface Moment {
  number: string
  label: string
  Icon: IconType
  eyebrow: string
  headline: string
  when: string
  tools: Tool[]
}

const MOMENTS: Moment[] = [
  {
    number: '01',
    label: 'VET',
    Icon: AlertTriangle,
    eyebrow: 'PROSPECT',
    headline: 'Scan the prospect before you sign anything.',
    when: 'A new client emails you. Nothing is in writing yet. Something feels off.',
    tools: [
      {
        name: 'Red Flag Detector',
        href: '/red-flag',
        helps: "Paste what they sent. Every risk graded — scope, payment, IP, timeline, posture — so you know which clauses the contract has to lock down.",
        Icon: Flag,
      },
      {
        name: 'Intake Questions',
        href: '/intake',
        helps: 'A tailored question list across scope, payment, rights, and timeline — so the contract reflects what was actually agreed, not what gets remembered later.',
        Icon: ClipboardList,
      },
    ],
  },
  {
    number: '02',
    label: 'SIGN',
    Icon: FileText,
    eyebrow: 'CONTRACT',
    headline: 'Analyze the contract for the clauses that quietly cost you.',
    when: "They sent the service agreement. You're about to sign.",
    tools: [
      {
        name: 'Analyze a contract',
        href: '/contracts/new',
        helps: 'Upload the PDF or paste the text. Get a 0–10 risk score, every flagged clause with severity, and the protections that are missing.',
        Icon: Scan,
      },
    ],
  },
  {
    number: '03',
    label: 'REPLY',
    Icon: MessageSquare,
    eyebrow: 'IN-FLIGHT',
    headline: 'Enforce the contract when the client tries to walk past it.',
    when: 'Free-work demands. Scope creep. Silence on payment. Chargeback threats.',
    tools: [
      {
        name: 'Defense Dashboard',
        href: '/projects',
        helps: 'Paste what the client said. The toolkit matches it against the 23 contract-protected situations and surfaces the specific clause that already covers you — the reply is the by-product, not the point.',
        Icon: MessageSquare,
      },
      {
        name: 'Arsenal',
        href: '/arsenal',
        helps: 'The full catalog of 23 contract-protected situations, grouped by category. Reference when you’re not sure which clause applies.',
        Icon: BookOpen,
      },
    ],
  },
  {
    number: '04',
    label: 'RECOVER',
    Icon: ShieldCheck,
    eyebrow: 'POST-DELIVERY',
    headline: 'Chase the invoice. Defend the chargeback. Hold the line.',
    when: 'The invoice is overdue, or the dispute just landed in your inbox.',
    tools: [
      {
        name: 'Payment tracking',
        href: '/projects',
        helps: 'Set a due date on the project. Overdue invoices surface on the dashboard with the right escalation cadence pre-staged.',
        Icon: Receipt,
      },
      {
        name: 'Dispute Pack',
        href: '/projects',
        helps: 'Pro feature. One click generates a Stripe / PayPal-ready 7-page PDF rebuttal — contract excerpts, timeline, communication log, sign-off proofs.',
        Icon: ScrollText,
      },
    ],
  },
]

interface Step {
  number: string
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    number: '01',
    title: 'Create a project',
    body: 'Each client engagement is a project. Name it, add the due date, drop in any quirks worth remembering.',
  },
  {
    number: '02',
    title: 'Add the contract (optional)',
    body: 'Uploading the service agreement powers smarter replies, deeper risk scoring, and the Dispute Pack.',
  },
  {
    number: '03',
    title: 'Use the right tool when something happens',
    body: 'Paste the client message into the project. The right reply is one click away — no template hunting.',
  },
  {
    number: '04',
    title: 'Recover or defend',
    body: 'Mark invoices received when paid. If they delay or dispute, the cadence and rebuttal pack are ready.',
  },
]

interface Reference {
  name: string
  href: string
  Icon: IconType
  helps: string
}

const REFERENCE: Reference[] = [
  {
    name: 'Arsenal',
    href: '/arsenal',
    Icon: BookOpen,
    helps: 'All 23 reply situations, grouped.',
  },
  {
    name: 'Analytics',
    href: '/analytics',
    Icon: BarChart2,
    helps: 'Your usage, win rate, and outcomes.',
  },
  {
    name: 'Feedback',
    href: '/feedback',
    Icon: Send,
    helps: 'Report a bug. Request a feature.',
  },
]

const serifItalic: React.CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontStyle: 'italic',
}

export default function ProductTourPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12 md:px-10 md:py-16">
      {/* ─── Hero ────────────────────────────────────────────────── */}
      <header className="mb-20 md:mb-24">
        <div className="mb-5 flex items-center gap-2.5">
          <Compass size={14} className="text-brand-lime" strokeWidth={2} aria-hidden />
          <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-text-muted">
            Field guide · v1
          </span>
        </div>
        <h1
          className="mb-5 text-[2.25rem] font-bold leading-[1.05] tracking-[-0.03em] text-text-primary md:text-[2.75rem]"
        >
          Your contract is the spine.{' '}
          <span style={serifItalic} className="text-text-secondary">
            The toolkit is the muscle around it.
          </span>
        </h1>
        <p className="max-w-[58ch] text-[0.95rem] leading-[1.65] text-text-secondary">
          Pushback isn&apos;t an AI that writes emails. It&apos;s the contract-grounded toolkit that
          protects every freelance engagement — vetted before you sign, analyzed when you do,
          enforced when the client pushes back, defended after delivery. Four moments, one
          contract, one chain of tools that all trace back to it.
        </p>
      </header>

      {/* ─── The four moments ────────────────────────────────────── */}
      <section aria-labelledby="moments-heading" className="mb-24 md:mb-28">
        <h2 id="moments-heading" className="sr-only">
          The four client moments
        </h2>

        <ol className="space-y-20 md:space-y-24">
          {MOMENTS.map((m, idx) => (
            <ScrollReveal
              key={m.label}
              as="li"
              direction={idx % 2 === 0 ? 'left' : 'right'}
              distance={60}
              className="relative"
            >
              {/* Chapter divider — hairline + lime tick */}
              <div className="mb-8 flex items-center gap-3">
                <span className="block h-[1px] w-8 bg-brand-lime" aria-hidden />
                <span className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-text-muted">
                  {m.eyebrow}
                </span>
              </div>

              <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-4 md:grid-cols-[6rem_1fr] md:gap-x-10">
                {/* Number — monospace, oversized */}
                <div className="font-mono text-[2.5rem] font-light leading-none text-text-muted md:text-[3rem]">
                  {m.number}
                </div>

                {/* Moment headline + content */}
                <div className="min-w-0">
                  {/* Verb label — oversized display */}
                  <div className="mb-5 flex items-baseline gap-3">
                    <span className="text-[2.75rem] font-black leading-[0.85] tracking-[-0.04em] text-text-primary md:text-[4rem]">
                      {m.label}
                    </span>
                    <m.Icon
                      size={20}
                      strokeWidth={1.75}
                      className="hidden text-brand-lime md:block"
                      aria-hidden
                    />
                  </div>

                  {/* Headline sentence */}
                  <h3 className="mb-3 max-w-[40ch] text-[1.1rem] font-semibold leading-[1.35] tracking-[-0.01em] text-text-primary md:text-[1.2rem]">
                    {m.headline}
                  </h3>

                  {/* Italic pull-quote "when" */}
                  <p
                    className="mb-8 max-w-[44ch] text-[1rem] leading-[1.55] text-text-secondary md:text-[1.05rem]"
                    style={serifItalic}
                  >
                    {m.when}
                  </p>

                  {/* Tools row */}
                  <ul className="grid gap-3 sm:grid-cols-2" aria-label={`Tools for ${m.label.toLowerCase()}`}>
                    {m.tools.map((t) => (
                      <li key={t.name} className="min-w-0">
                        <Link
                          href={t.href}
                          className="group block rounded-lg border border-bg-border bg-bg-surface/50 p-4 transition-all duration-200 hover:border-brand-lime/40 hover:bg-bg-surface focus-visible:border-brand-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime/30"
                        >
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <t.Icon
                                size={13}
                                strokeWidth={1.75}
                                className="shrink-0 text-text-muted transition-colors group-hover:text-brand-lime"
                                aria-hidden
                              />
                              <span className="truncate text-[0.875rem] font-semibold text-text-primary">
                                {t.name}
                              </span>
                            </div>
                            <ArrowUpRight
                              size={14}
                              strokeWidth={1.75}
                              className="shrink-0 text-text-muted transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-lime"
                              aria-hidden
                            />
                          </div>
                          <p className="text-[0.825rem] leading-[1.5] text-text-secondary">
                            {t.helps}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </ol>
      </section>

      {/* ─── Getting started ─────────────────────────────────────── */}
      <section aria-labelledby="start-heading" className="mb-24 md:mb-28">
       <ScrollReveal direction="up" distance={48}>
        <div className="mb-10 flex items-center gap-3">
          <span className="block h-[1px] w-8 bg-brand-lime" aria-hidden />
          <span className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-text-muted">
            Path
          </span>
        </div>

        <h2
          id="start-heading"
          className="mb-12 max-w-[28ch] text-[1.75rem] font-bold leading-[1.15] tracking-[-0.02em] text-text-primary md:text-[2rem]"
        >
          The shortest path through the toolkit.
        </h2>

        <ol className="space-y-8 border-l border-bg-border pl-6 md:space-y-10 md:pl-8">
          {STEPS.map((s) => (
            <li key={s.number} className="relative">
              {/* Lime tick on the timeline */}
              <span
                aria-hidden
                className="absolute -left-[1.625rem] top-1.5 h-2 w-2 rounded-full bg-brand-lime md:-left-[2.125rem]"
              />
              <div className="mb-1 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-brand-lime">
                Step {s.number}
              </div>
              <h3 className="mb-1.5 text-[1.05rem] font-semibold leading-tight tracking-[-0.01em] text-text-primary">
                {s.title}
              </h3>
              <p className="max-w-[52ch] text-[0.925rem] leading-[1.6] text-text-secondary">
                {s.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-12 md:mt-14">
          <Link
            href="/projects/new"
            className="group inline-flex items-center gap-2 rounded-lg bg-brand-lime px-5 py-3 text-[0.9rem] font-bold tracking-tight text-[#0a0a0a] transition-opacity duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
          >
            Create your first project
            <ArrowUpRight
              size={15}
              strokeWidth={2.25}
              className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>
        </ScrollReveal>
      </section>

      {/* ─── Reference ────────────────────────────────────────────── */}
      <section aria-labelledby="reference-heading" className="mb-20">
       <ScrollReveal direction="up" distance={32}>
        <div className="mb-6 flex items-center gap-3">
          <span className="block h-[1px] w-8 bg-brand-lime" aria-hidden />
          <span className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-text-muted">
            Elsewhere
          </span>
        </div>

        <h2
          id="reference-heading"
          className="mb-8 max-w-[36ch] text-[1.25rem] font-semibold leading-tight tracking-[-0.01em] text-text-primary md:text-[1.4rem]"
        >
          Three places worth remembering.
        </h2>

        <ul className="grid gap-3 sm:grid-cols-3">
          {REFERENCE.map((r) => (
            <li key={r.name}>
              <Link
                href={r.href}
                className="group block h-full rounded-lg border border-bg-border bg-bg-surface/40 p-4 transition-all duration-200 hover:border-brand-lime/40 hover:bg-bg-surface focus-visible:border-brand-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime/30"
              >
                <div className="mb-2 flex items-center justify-between">
                  <r.Icon
                    size={14}
                    strokeWidth={1.75}
                    className="text-text-muted transition-colors group-hover:text-brand-lime"
                    aria-hidden
                  />
                  <ArrowUpRight
                    size={13}
                    strokeWidth={1.75}
                    className="text-text-muted transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-lime"
                    aria-hidden
                  />
                </div>
                <div className="mb-1 text-[0.875rem] font-semibold text-text-primary">
                  {r.name}
                </div>
                <p className="text-[0.8rem] leading-[1.5] text-text-secondary">{r.helps}</p>
              </Link>
            </li>
          ))}
        </ul>
       </ScrollReveal>
      </section>

      {/* ─── Closer ──────────────────────────────────────────────── */}
      <ScrollReveal direction="up" distance={24} as="div" className="border-t border-bg-border pt-8">
        <p
          className="text-center text-[0.95rem] text-text-secondary"
          style={serifItalic}
        >
          Stuck or missing something?{' '}
          <Link
            href="/feedback"
            className="text-brand-lime no-underline transition-opacity duration-150 hover:opacity-80 focus-visible:outline-none focus-visible:underline focus-visible:decoration-brand-lime focus-visible:underline-offset-4"
            style={{ fontStyle: 'normal', fontFamily: 'var(--font-sans, inherit)', fontWeight: 600 }}
          >
            Tell us →
          </Link>
        </p>
      </ScrollReveal>
    </div>
  )
}
