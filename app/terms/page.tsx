import Link from 'next/link'

export default function TermsPage() {
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
          Terms of Service
        </h1>

        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '1rem', padding: '2.5rem' }}>

          <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.2, marginTop: 0, marginBottom: '0.75rem' }}>
            Introduction
          </h2>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '1rem' }}>
            These Terms of Service (&quot;Terms&quot;) govern your use of Pushback (&quot;Service&quot;). By creating an account or using the Service you agree to these Terms.
          </p>

          <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.2, marginTop: '2rem', marginBottom: '0.75rem' }}>
            The Service
          </h2>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '1rem' }}>
            Pushback is an AI-powered tool that helps freelancers generate professional written responses to difficult client situations and analyse contract PDFs for potential risks. The free tier includes 1 AI-powered response and 1 contract analysis. The Pro plan provides unlimited responses and contract analyses for a monthly subscription fee.
          </p>

          <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.2, marginTop: '2rem', marginBottom: '0.75rem' }}>
            AI Output Disclaimer
          </h2>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '1rem' }}>
            Pushback generates AI-powered written responses and contract analyses for informational purposes only. Outputs are not legal advice and should not be relied upon as such. You are solely responsible for reviewing any AI output before sending it to a client or acting on it. We do not guarantee the accuracy, completeness, or fitness of any AI output for a particular purpose.
          </p>

          <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.2, marginTop: '2rem', marginBottom: '0.75rem' }}>
            Acceptable Use
          </h2>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '1rem' }}>
            You agree not to use the Service to generate unlawful, harassing, defamatory, or fraudulent content. You also agree not to reverse-engineer or resell the Service, or attempt to circumvent plan limits or rate limits. Violation of these terms may result in immediate account suspension.
          </p>

          <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.2, marginTop: '2rem', marginBottom: '0.75rem' }}>
            Subscriptions and Billing
          </h2>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '1rem' }}>
            Pro subscriptions are billed monthly in advance via Stripe. By subscribing, you authorise Pushback to charge your payment method on a recurring monthly basis until you cancel. Prices may change with at least 30 days&apos; notice sent to your account email address. All charges are processed by Stripe, Inc., and are subject to Stripe&apos;s Terms of Service.
          </p>

          <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.2, marginTop: '2rem', marginBottom: '0.75rem' }}>
            Cancellation
          </h2>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '1rem' }}>
            You may cancel your Pro subscription at any time from your account settings or by emailing hello@pushback.to. Cancellation takes effect at the end of the current billing period — you retain Pro access until that date, and no pro-rated refunds are issued for the remaining days. Cancellations requested within 30 days of the first Pro charge on a given account are eligible for a full refund on request.
          </p>

          <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.2, marginTop: '2rem', marginBottom: '0.75rem' }}>
            Account Termination
          </h2>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '1rem' }}>
            We may suspend or terminate accounts that violate these Terms or present a security risk, with notice where practicable. You may also delete your own account at any time from your account settings. Upon termination, your data will be removed in accordance with our Privacy Policy.
          </p>

          <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.2, marginTop: '2rem', marginBottom: '0.75rem' }}>
            Intellectual Property
          </h2>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '1rem' }}>
            The Service, including its code, branding, and user interface, is owned by Pushback. AI outputs generated for your account are yours to use as you see fit, subject to the AI Output Disclaimer above. You retain all rights to the content you upload or submit to the Service.
          </p>

          <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.2, marginTop: '2rem', marginBottom: '0.75rem' }}>
            Limitation of Liability
          </h2>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '1rem' }}>
            To the maximum extent permitted by applicable law, Pushback is not liable for indirect, incidental, special, or consequential damages arising from your use of the Service. In all cases, our total liability to you shall not exceed the total amount you paid for the Service in the twelve months preceding the claim.
          </p>

          <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.2, marginTop: '2rem', marginBottom: '0.75rem' }}>
            Changes to These Terms
          </h2>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '1rem' }}>
            We may update these Terms from time to time. When we do, we will update the &quot;Last updated&quot; date at the top of this page. Continued use of the Service after an update constitutes your acceptance of the revised Terms. Where feasible, material changes will be announced by email to your registered address.
          </p>

          <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.2, marginTop: '2rem', marginBottom: '0.75rem' }}>
            Contact
          </h2>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '1rem' }}>
            Questions about these Terms? Contact us at{' '}
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
