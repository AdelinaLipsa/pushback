import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh', padding: '3rem 1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '680px', margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem', textDecoration: 'none' }}>
            <span style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Pushback</span>
            <span style={{ color: 'var(--brand-lime)', fontWeight: 800, fontSize: '1.5rem' }}>.</span>
          </Link>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.85rem' }}>
            Last updated: April 2026 · Contact: hello@pushback.to
          </p>
        </div>

        <h1 style={{ color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.1, marginBottom: '1.5rem', textAlign: 'center' }}>
          Privacy Policy
        </h1>

        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '1rem', padding: '2.5rem' }}>

          <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.2, marginTop: 0, marginBottom: '0.75rem' }}>
            Introduction
          </h2>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '1rem' }}>
            Pushback ("we", "our", "us") operates this application and is committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, who we share it with, and your rights. If you have questions or requests, contact us at hello@pushback.to.
          </p>

          <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.2, marginTop: '2rem', marginBottom: '0.75rem' }}>
            Data We Collect
          </h2>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '1rem' }}>
            We collect the following categories of data when you use Pushback:
          </p>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '1rem' }}>
            <strong>Account data:</strong> Your email address and hashed password, managed securely via Supabase Auth. If you sign in with Google, we receive only the email address and profile ID provided by Google OAuth.
          </p>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '1rem' }}>
            <strong>Session cookies:</strong> Essential session cookies set by Supabase Auth to keep you signed in across page loads. No advertising or tracking cookies are used.
          </p>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '1rem' }}>
            <strong>Defense-tool inputs:</strong> The client situation text you type into Pushback's response generator. This text is sent to Anthropic to generate AI-powered replies on your behalf.
          </p>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '1rem' }}>
            <strong>Uploaded contract PDFs:</strong> PDF files you upload for contract analysis. These files are transmitted to Anthropic for processing and are stored temporarily under our Anthropic Files API account.
          </p>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '1rem' }}>
            <strong>Usage metadata:</strong> The number of AI responses and contract analyses generated on your account, used for plan enforcement and usage reporting.
          </p>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '1rem' }}>
            <strong>Stripe billing metadata:</strong> Your Stripe customer ID and subscription ID. We never see, store, or process your card number or full payment details — those are handled exclusively by Stripe.
          </p>

          <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.2, marginTop: '2rem', marginBottom: '0.75rem' }}>
            How We Use AI (Anthropic as Processor)
          </h2>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '1rem' }}>
            Uploaded contract PDFs and client-situation text you submit to Pushback are sent to Anthropic, PBC as a data processor to generate AI-powered analysis and responses. Anthropic processes this content on our behalf under its own data processing terms and does not retain it for training. We do not sell your content or share it with other third parties.
          </p>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '1rem' }}>
            AI outputs generated by Anthropic's models are returned to Pushback and stored in our database, associated with your account. You can delete your account at any time to remove this data.
          </p>

          <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.2, marginTop: '2rem', marginBottom: '0.75rem' }}>
            Stripe Payment Processing
          </h2>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '1rem' }}>
            Stripe, Inc. handles all subscription billing for Pushback Pro. When you subscribe, your payment information is submitted directly to Stripe's secure servers. We receive only a Stripe customer ID, subscription ID, and billing event metadata (such as whether a payment succeeded or failed) — never your card number, full card details, or bank information.
          </p>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '1rem' }}>
            Stripe's privacy practices are governed by Stripe's own Privacy Policy, available at stripe.com.
          </p>

          <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.2, marginTop: '2rem', marginBottom: '0.75rem' }}>
            Cookies and Sessions
          </h2>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '1rem' }}>
            Pushback uses essential cookies only — specifically, the session cookies set by Supabase Auth to maintain your login state. These cookies are strictly necessary for the application to function. We do not use advertising cookies, third-party tracking cookies, or analytics cookies.
          </p>

          <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.2, marginTop: '2rem', marginBottom: '0.75rem' }}>
            Data Retention
          </h2>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '1rem' }}>
            Contract PDFs and AI-generated responses are retained in our systems while your account is active. When you delete your account, your user profile and all associated AI responses are removed from our database within 30 days. Contract PDFs stored via the Anthropic Files API are deleted at the same time. Session data is cleared immediately upon account deletion.
          </p>

          <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.2, marginTop: '2rem', marginBottom: '0.75rem' }}>
            Your Rights
          </h2>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '1rem' }}>
            You have the right to access, export, correct, or delete the personal data we hold about you. To submit any of these requests, email us at hello@pushback.to from the address associated with your Pushback account. We will respond within 30 days.
          </p>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '1rem' }}>
            You may also delete your account directly from your account settings, which will trigger the data removal process described above.
          </p>

          <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.2, marginTop: '2rem', marginBottom: '0.75rem' }}>
            Data Transfers
          </h2>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '1rem' }}>
            Pushback is hosted using services that may process your data in the United States and European Union. Our third-party processors include: Supabase (database and authentication), Vercel (hosting and edge delivery), Stripe (payment processing), Anthropic (AI inference), and Resend (transactional email). Each of these providers maintains its own data security and privacy standards.
          </p>

          <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.2, marginTop: '2rem', marginBottom: '0.75rem' }}>
            Changes to This Policy
          </h2>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '1rem' }}>
            We may update this Privacy Policy from time to time. When we do, we will update the "Last updated" date at the top of this page. Continued use of Pushback after an update constitutes your acceptance of the revised policy. For material changes, we will endeavour to notify you by email where feasible.
          </p>

          <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.2, marginTop: '2rem', marginBottom: '0.75rem' }}>
            Contact
          </h2>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '1rem' }}>
            If you have any questions about this Privacy Policy or how we handle your data, please contact us at{' '}
            <Link href="mailto:hello@pushback.to" style={{ color: 'var(--brand-lime)', fontWeight: 500, textDecoration: 'none' }}>hello@pushback.to</Link>.
          </p>

        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <Link href="/" style={{ color: 'var(--brand-lime)', fontWeight: 500, textDecoration: 'none' }}>← Back to Pushback</Link>
        </p>

      </div>
    </div>
  )
}
