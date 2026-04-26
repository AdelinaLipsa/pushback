import Link from 'next/link'
import { DEFENSE_TOOLS } from '@/lib/defenseTools'
import Footer from '@/components/shared/Footer'

const TOOL_GROUPS: { heading: string; types: string[] }[] = [
  {
    heading: 'Payment Issues',
    types: ['payment_first', 'payment_second', 'payment_final', 'retroactive_discount', 'disputed_hours'],
  },
  {
    heading: 'Scope & Delivery',
    types: ['scope_change', 'revision_limit', 'moving_goalposts', 'post_handoff_request', 'delivery_signoff'],
  },
  {
    heading: 'Client Behavior',
    types: ['ghost_client', 'feedback_stall', 'chargeback_threat', 'review_threat', 'dispute_response', 'spec_work_pressure'],
  },
  {
    heading: 'Pricing & Rates',
    types: ['discount_pressure', 'rate_increase_pushback', 'rush_fee_demand', 'kill_fee', 'ip_dispute'],
  },
]

export default function HowItWorksPage() {
  return (
    <div style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh' }}>

      {/* Minimal logo header — same as privacy/terms pages */}
      <div style={{ textAlign: 'center', padding: '3rem 1.5rem 2rem' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem', textDecoration: 'none' }}>
          <span style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Pushback</span>
          <span style={{ color: 'var(--brand-lime)', fontWeight: 800, fontSize: '1.5rem' }}>.</span>
        </Link>
      </div>

      {/* Page content */}
      <div style={{ width: '100%', maxWidth: '760px', margin: '0 auto', padding: '0 1.5rem 4rem' }}>

        {/* Eyebrow + H1 */}
        <p style={{ color: 'var(--brand-lime)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1rem', textAlign: 'center' }}>
          How it works
        </p>
        <h1 style={{ color: 'var(--text-primary)', fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 600, lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: '1.5rem', textAlign: 'center' }}>
          Pushback — How It Works
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.65, marginBottom: '3rem', textAlign: 'center' }}>
          Pushback gives freelancers a professional, ready-to-send response to any uncomfortable client situation in under 30 seconds. No legal background, no copywriting required.
        </p>

        {/* Three ways to use Pushback */}
        <section style={{ marginBottom: '3.5rem' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>
            Three ways to use Pushback
          </h2>

          {/* Mode 1 */}
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1rem' }}>
            <p style={{ color: 'var(--brand-lime)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>Mode 1</p>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem' }}>Paste a client message</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Drop the email or DM into the analyze box. Pushback identifies the situation type — scope creep, late payment, ghosting, rate pressure — and pre-fills the right response tool. One click and you have a professional reply.
            </p>
          </div>

          {/* Mode 2 */}
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1rem' }}>
            <p style={{ color: 'var(--brand-lime)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>Mode 2</p>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem' }}>Pick a defense tool directly</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Already know what you&apos;re dealing with? Pick the tool from the sidebar — Scope Change, Late Payment, Ghost Client, Kill Fee, and 17 more. Add a few details about your situation, and Pushback drafts a tailored response.
            </p>
          </div>

          {/* Mode 3 */}
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '0.75rem', padding: '1.5rem' }}>
            <p style={{ color: 'var(--brand-lime)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>Mode 3</p>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem' }}>Attach your contract</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Upload your signed contract once. Pushback reads it and uses your actual clauses — payment terms, revision limits, kill fees — in every response it drafts for that project. Your replies reference your real agreement, not generic advice.
            </p>
          </div>
        </section>

        {/* Tool Directory */}
        <section style={{ marginBottom: '3.5rem' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            The full tool directory
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            21 defense tools, grouped by what&apos;s happening with your client. Pick one when you know exactly what you&apos;re dealing with.
          </p>

          {TOOL_GROUPS.map(group => (
            <div key={group.heading} style={{ marginBottom: '2rem' }}>
              <h3 style={{
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '1rem',
              }}>
                {group.heading}
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {group.types.map(type => {
                  const tool = DEFENSE_TOOLS.find(t => t.type === type)
                  if (!tool) return null
                  return (
                    <li key={type} style={{ fontSize: '0.9rem', lineHeight: 1.55 }}>
                      <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{tool.label}</strong>
                      <span style={{ color: 'var(--text-secondary)' }}> — {tool.description}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </section>

        {/* Contract analysis */}
        <section style={{ marginBottom: '3.5rem' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            How contract analysis works
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '1rem' }}>
            Upload your signed contract once. Pushback reads it, scores its risk, and identifies which clauses cover payment terms, revisions, IP, kill fees, and scope. From that point on, every response Pushback drafts for that project quotes your actual contract — not generic advice.
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.65 }}>
            Free accounts get one contract analysis. Pro accounts can analyze unlimited contracts and link them to multiple projects. Contract text is processed by Anthropic on our behalf and is never stored as raw text — only structured analysis is kept on your account.
          </p>
        </section>

        {/* FAQ */}
        <section style={{ marginBottom: '3.5rem' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>
            Frequently asked
          </h2>

          {[
            {
              q: 'How many responses can I generate on the free plan?',
              a: '3 AI-generated responses and 1 contract analysis, total — not per month. Pro accounts get unlimited responses and contract analyses.',
            },
            {
              q: 'Where do my client messages and contracts go?',
              a: 'Pushback sends them to Anthropic (Claude) as a data processor to generate responses. Anthropic does not retain your content for training. Raw contract text is read, analyzed, and discarded — only the structured analysis is stored on your account.',
            },
            {
              q: 'Can I delete my data?',
              a: 'Yes. You can delete any individual project, contract, or response from the dashboard. To delete your entire account and all associated data, email us from the address linked to your account — see the data deletion link in the footer.',
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
              q: 'Can I cancel my Pro subscription?',
              a: 'Yes — anytime, from the billing portal linked in your account. You keep Pro access until the end of the current billing period.',
            },
          ].map(({ q, a }) => (
            <div key={q} style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              borderRadius: '0.75rem',
              padding: '1.25rem 1.5rem',
              marginBottom: '0.75rem',
            }}>
              <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {q}
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {a}
              </p>
            </div>
          ))}
        </section>

      </div>

      <Footer />
    </div>
  )
}
