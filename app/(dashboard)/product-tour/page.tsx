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
    headline: 'Catch the bad client before they’re a client.',
    when: 'The first email already reads like a problem. You’ve felt this before — and last time it cost you a month.',
    tools: [
      {
        name: 'Red Flag Detector',
        href: '/red-flag',
        helps: "Paste what they sent. Every risk graded across scope, payment, IP, timeline, and posture — so you walk into contract talks already knowing which clauses have to lock down. One hour here saves the month you’d lose on the wrong client.",
        Icon: Flag,
      },
      {
        name: 'Intake Questions',
        href: '/intake',
        helps: 'The questions a senior lawyer would ask before you say yes — scope, payment, rights, timeline, sign-off. The answers become the contract. The contract becomes the leverage.',
        Icon: ClipboardList,
      },
    ],
  },
  {
    number: '02',
    label: 'SIGN',
    Icon: FileText,
    eyebrow: 'CONTRACT',
    headline: 'Surface the clauses that quietly cost you — before you sign them.',
    when: 'They sent the service agreement. Most of it is fine. The parts that aren’t are the parts you’d skim.',
    tools: [
      {
        name: 'Analyze a contract',
        href: '/contracts/new',
        helps: 'Upload the PDF or paste the text. A 0–10 risk score, every flagged clause graded by severity, and the protections you’re missing — laid out plainly. Sign the contract that protects you, or negotiate the version that does.',
        Icon: Scan,
      },
    ],
  },
  {
    number: '03',
    label: 'REPLY',
    Icon: MessageSquare,
    eyebrow: 'IN-FLIGHT',
    headline: 'When they push, push back with the contract they signed.',
    when: 'Free-work demands. Scope creep. Silence on payment. Approved-then-changed. Chargeback threats. Twenty-three of these. Every one drains hours and dignity.',
    tools: [
      {
        name: 'Defense Dashboard',
        href: '/projects',
        helps: 'Paste what the client said. The toolkit matches it against the 23 contract-protected situations and pulls the exact clause that already covers you. The reply is the by-product. The leverage is the point.',
        Icon: MessageSquare,
      },
      {
        name: 'Arsenal',
        href: '/arsenal',
        helps: 'The full catalog of 23 contract-protected situations, grouped by category. The shelf you reach for when you need to know — without a doubt — that what they’re asking for isn’t in scope.',
        Icon: BookOpen,
      },
    ],
  },
  {
    number: '04',
    label: 'RECOVER',
    Icon: ShieldCheck,
    eyebrow: 'POST-DELIVERY',
    headline: 'When the invoice slips or the dispute lands, you’re already packed for the fight.',
    when: 'Overdue invoices. Chargeback filings. The moment that decides whether the work pays — or doesn’t.',
    tools: [
      {
        name: 'Payment tracking',
        href: '/projects',
        helps: 'Set a due date on the project. Overdue invoices surface on the dashboard with the right escalation cadence already staged — polite, firm, final. You stop chasing and start collecting.',
        Icon: Receipt,
      },
      {
        name: 'Dispute Pack',
        href: '/projects',
        helps: 'Pro feature. One click generates a Stripe / PayPal-ready 7-page rebuttal PDF — contract excerpts, timeline, communication log, sign-off proofs. The packet the bank actually reads. Most disputes flip with it.',
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
    title: 'Open a project',
    body: 'Every engagement is its own dossier. Name the client, set the due date, drop in the quirks worth remembering. This is the spine everything else hangs on.',
  },
  {
    number: '02',
    title: 'Drop in the contract',
    body: 'Optional — but it’s how the toolkit gets sharp. The contract powers smarter replies, deeper risk scoring, and the Dispute Pack if a chargeback ever lands. Most users do this first.',
  },
  {
    number: '03',
    title: 'Reach for the right tool when something happens',
    body: 'Paste the client message into the project. The right counter is one click away — already grounded in the clause they signed. No template hunting. No drafting under pressure.',
  },
  {
    number: '04',
    title: 'Get paid. Defend the dispute.',
    body: 'Mark invoices received when paid. If they delay, the escalation cadence runs itself. If they dispute, the rebuttal pack is one click from generated.',
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
    helps: 'All 23 situations, grouped. The shelf you reach for under pressure.',
  },
  {
    name: 'Analytics',
    href: '/analytics',
    Icon: BarChart2,
    helps: 'Your usage, win rate, and the revenue you recovered.',
  },
  {
    name: 'Feedback',
    href: '/feedback',
    Icon: Send,
    helps: 'Report a bug. Request a tool. Push us harder.',
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
          Twenty-three things clients try when they think no one&apos;s watching. Four moments
          where each one shows up. Pushback walks every move back to the clause they signed —
          so you stop drafting replies under pressure and start working from leverage.
        </p>
      </header>

      {/* ─── By the numbers ──────────────────────────────────────── */}
      <section
        aria-labelledby="numbers-heading"
        className="mb-24 border-y border-bg-border py-10 md:mb-28 md:py-12"
      >
        <h2 id="numbers-heading" className="sr-only">
          By the numbers
        </h2>
        <dl className="grid grid-cols-3 divide-x divide-bg-border">
          <div className="pr-4 md:pr-6">
            <dt className="mb-2 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-text-muted">
              Moments
            </dt>
            <dd className="mb-1.5 text-[2.5rem] font-black leading-none tracking-[-0.04em] text-text-primary md:text-[3rem]">
              4
            </dd>
            <p className="max-w-[20ch] text-[0.78rem] leading-[1.45] text-text-secondary">
              Covered end to end — vet, sign, reply, recover.
            </p>
          </div>
          <div className="px-4 md:px-6">
            <dt className="mb-2 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-text-muted">
              Situations
            </dt>
            <dd className="mb-1.5 text-[2.5rem] font-black leading-none tracking-[-0.04em] text-brand-lime md:text-[3rem]">
              23
            </dd>
            <p className="max-w-[20ch] text-[0.78rem] leading-[1.45] text-text-secondary">
              Contract-protected counter-moves, ready before the moment hits.
            </p>
          </div>
          <div className="pl-4 md:pl-6">
            <dt className="mb-2 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-text-muted">
              Drafting
            </dt>
            <dd className="mb-1.5 text-[2.5rem] font-black leading-none tracking-[-0.04em] text-text-primary md:text-[3rem]">
              0
            </dd>
            <p className="max-w-[20ch] text-[0.78rem] leading-[1.45] text-text-secondary">
              Seconds spent inventing replies under pressure.
            </p>
          </div>
        </dl>
      </section>

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
      <ScrollReveal direction="up" distance={24} as="div" className="border-t border-bg-border pt-10">
        <p
          className="mx-auto max-w-[42ch] text-center text-[1.05rem] leading-[1.5] text-text-secondary md:text-[1.15rem]"
          style={serifItalic}
        >
          Twenty-three situations. You&apos;ll meet most of them.
          The first one you log is the one you stop dreading.
        </p>
        <div className="mt-7 text-center">
          <Link
            href="/feedback"
            className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-text-muted transition-colors duration-150 hover:text-brand-lime focus-visible:text-brand-lime focus-visible:outline-none"
          >
            Missing a tool? Tell us →
          </Link>
        </div>
      </ScrollReveal>
    </div>
  )
}
