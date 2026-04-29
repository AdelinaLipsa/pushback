import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const isDev = process.env.NODE_ENV === 'development'

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''};
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://sentry.io https://*.sentry.io;
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
      // Admin alias
      { source: '/analytics', destination: '/admin', permanent: false },
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
