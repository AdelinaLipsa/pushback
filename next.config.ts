import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const isDev = process.env.NODE_ENV === 'development'

// CSP allowlist notes:
// - Stripe needs js.stripe.com (script), api.stripe.com (xhr), and three
//   frame domains (js, hooks, m.stripe.network for 3-D Secure). Without
//   these the upgrade flow creates an `incomplete` subscription but
//   Stripe Elements can never mount and the user sees a broken /checkout.
// - Vercel Live (vercel.live/feedback.js + websockets) is the in-product
//   comments widget. Harmless console warning if blocked; allowed here so
//   the warning stops cluttering devtools.
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://js.stripe.com https://vercel.live;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://*.stripe.com;
  font-src 'self' https://fonts.gstatic.com https://vercel.live;
  frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://m.stripe.network https://vercel.live;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://sentry.io https://*.sentry.io https://api.stripe.com https://q.stripe.com https://vercel.live wss://ws-us3.pusher.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      // Auth aliases
      { source: '/register', destination: '/signup', permanent: true },
      { source: '/signin', destination: '/login', permanent: true },
      // Free trial alias
      { source: '/free-trial', destination: '/signup', permanent: true },
      // Landing page anchor sections
      { source: '/pricing', destination: '/#pricing', permanent: false },
      { source: '/demo', destination: '/#live-demo', permanent: false },
      // Help / product education
      { source: '/faq', destination: '/how-it-works', permanent: true },
      { source: '/help', destination: '/how-it-works', permanent: true },
      { source: '/docs', destination: '/how-it-works', permanent: true },
      { source: '/documentation', destination: '/how-it-works', permanent: true },
      { source: '/tour', destination: '/how-it-works', permanent: true },
      { source: '/features', destination: '/how-it-works', permanent: true },
      { source: '/use-cases', destination: '/how-it-works', permanent: true },
      { source: '/resources', destination: '/how-it-works', permanent: true },
      // Support / contact
      { source: '/support', destination: '/feedback', permanent: true },
      { source: '/contact', destination: '/feedback', permanent: true },
      // Legal / security
      { source: '/security', destination: '/privacy', permanent: true },
      // Marketing pages that don't exist → home
      { source: '/about', destination: '/', permanent: false },
      { source: '/blog', destination: '/', permanent: false },
      { source: '/case-studies', destination: '/', permanent: false },
      { source: '/changelog', destination: '/', permanent: false },
      { source: '/compare', destination: '/', permanent: false },
      { source: '/customers', destination: '/', permanent: false },
      { source: '/developers', destination: '/', permanent: false },
      { source: '/integrations', destination: '/', permanent: false },
      { source: '/roadmap', destination: '/', permanent: false },
      { source: '/testimonials', destination: '/', permanent: false },
      { source: '/alternatives', destination: '/', permanent: false },
    ]
  },
  serverExternalPackages: [
    'require-in-the-middle',
    'import-in-the-middle',
    '@opentelemetry/instrumentation',
  ],
  turbopack: {
    root: import.meta.dirname,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\n/g, ''),
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  org: 'bitly-2h',
  project: 'pushback',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: { disable: true },
  webpack: {
    treeshake: { removeDebugLogging: true },
    automaticVercelMonitors: false,
  },
})
