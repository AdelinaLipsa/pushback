import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import SiteLoader from '@/components/shared/SiteLoader'
import { Analytics } from '@vercel/analytics/next'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-inter',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pushback.to'

export const metadata: Metadata = {
  title: 'Pushback — Client interaction toolkit for freelancers',
  description: 'Stop losing money to scope creep, late payments, and difficult clients. Pushback is the complete client interaction toolkit for freelancers — professional responses, contract protection, and payment escalation.',
  metadataBase: new URL(APP_URL),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
  },
  openGraph: {
    title: 'Pushback — Client interaction toolkit for freelancers',
    description: 'Stop losing money to scope creep, late payments, and difficult clients. Pushback is the complete client interaction toolkit for freelancers — professional responses, contract protection, and payment escalation.',
    url: APP_URL,
    siteName: 'Pushback',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pushback — Client interaction toolkit for freelancers',
    description: 'Stop losing money to scope creep, late payments, and difficult clients. Pushback is the complete client interaction toolkit for freelancers — professional responses, contract protection, and payment escalation.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SiteLoader />
        {children}
        <Toaster theme="dark" position="bottom-right" />
        <Analytics />
      </body>
    </html>
  )
}
