import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import SiteLoader from '@/components/shared/SiteLoader'
import CookieConsent from '@/components/shared/CookieConsent'
import ConsentGatedAnalytics from '@/components/shared/ConsentGatedAnalytics'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-inter',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pushback.to'

const SITE_TITLE = 'Pushback — The freelancer toolkit for the full client lifecycle'
const SITE_DESCRIPTION = 'Vet prospects for red flags before you sign, analyze contracts for hidden risk, reply across 23 situations with contract-grounded responses, and recover overdue payments — all in one connected toolkit for freelancers.'

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  metadataBase: new URL(APP_URL),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: APP_URL,
    siteName: 'Pushback',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <SiteLoader />
        {children}
        <Toaster theme="dark" position="bottom-right" />
        <CookieConsent />
        <ConsentGatedAnalytics />
      </body>
    </html>
  )
}
