import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set`)
  return value
}

const FROM = requireEnv('RESEND_FROM_EMAIL')
const APP_URL = requireEnv('NEXT_PUBLIC_APP_URL')

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export interface BillingDetails {
  amount: string | null
  nextBillingDate: string | null
}

function welcomeHtml(): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #2a2a2a;border-radius:12px;">
        <tr><td style="padding:32px 40px;border-bottom:1px solid #2a2a2a;">
          <span style="font-weight:800;font-size:1.5rem;color:#fafafa;">Pushback</span><span style="color:#84cc16;font-weight:800;font-size:1.5rem;">.</span>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <h1 style="color:#fafafa;font-size:1.25rem;margin:0 0 16px;">Your free account is ready.</h1>
          <p style="color:#a1a1aa;line-height:1.6;margin:0 0 16px;">
            You have <strong style="color:#fafafa;">1 free AI-powered response</strong> and <strong style="color:#fafafa;">1 contract analysis</strong>. Use them on any project &mdash; no credit card needed.
          </p>
          <p style="color:#a1a1aa;line-height:1.6;margin:0 0 24px;">
            When you&rsquo;re ready for unlimited access, upgrade to Pro.
          </p>
          <a href="${APP_URL}/dashboard" style="display:inline-block;background:#84cc16;color:#0a0a0a;font-weight:700;padding:16px 24px;border-radius:8px;text-decoration:none;font-size:0.95rem;">Go to Dashboard</a>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #2a2a2a;">
          <p style="color:#52525b;font-size:13px;margin:0;">Pushback &mdash; ${process.env.SUPPORT_EMAIL ?? FROM}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function upgradeHtml(billing: BillingDetails): string {
  const billingBlock =
    billing.amount !== null && billing.nextBillingDate !== null
      ? `<p style="color:#a1a1aa;line-height:1.6;margin:0 0 16px;">
          Amount charged: <strong style="color:#fafafa;">${escapeHtml(billing.amount)}</strong><br>
          Next billing date: <strong style="color:#fafafa;">${escapeHtml(billing.nextBillingDate)}</strong>
        </p>`
      : `<p style="color:#a1a1aa;line-height:1.6;margin:0 0 16px;">Billing details are available in your Stripe dashboard.</p>`

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #2a2a2a;border-radius:12px;">
        <tr><td style="padding:32px 40px;border-bottom:1px solid #2a2a2a;">
          <span style="font-weight:800;font-size:1.5rem;color:#fafafa;">Pushback</span><span style="color:#84cc16;font-weight:800;font-size:1.5rem;">.</span>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <h1 style="color:#fafafa;font-size:1.25rem;margin:0 0 16px;">You're on Pushback Pro.</h1>
          <p style="color:#a1a1aa;line-height:1.6;margin:0 0 16px;">
            Unlimited AI-powered responses and contract analyses are now active on your account.
          </p>
          ${billingBlock}
          <p style="color:#a1a1aa;line-height:1.6;margin:0 0 24px;">Thank you for upgrading.</p>
          <a href="${APP_URL}/dashboard" style="display:inline-block;background:#f59e0b;color:#0a0a0a;font-weight:700;padding:16px 24px;border-radius:8px;text-decoration:none;font-size:0.95rem;">Back to Dashboard</a>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #2a2a2a;">
          <p style="color:#52525b;font-size:13px;margin:0;">Pushback &mdash; ${process.env.SUPPORT_EMAIL ?? FROM}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendWelcomeEmail(to: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: 'Welcome to Pushback — your free account is ready',
    html: welcomeHtml(),
  })
  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }
}

export async function sendUpgradeEmail(to: string, billing: BillingDetails): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "You're on Pushback Pro",
    html: upgradeHtml(billing),
  })
  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }
}
