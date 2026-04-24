import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-inter',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pushback.app'

export const metadata: Metadata = {
  title: 'Pushback — AI responses for freelancer client problems',
  description: 'Stop losing money to scope creep, late payments, and difficult clients. Get a professional, ready-to-send response in under a minute.',
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: 'Pushback — AI responses for freelancer client problems',
    description: 'Stop losing money to scope creep, late payments, and difficult clients. Get a professional, ready-to-send response in under a minute.',
    url: APP_URL,
    siteName: 'Pushback',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pushback — AI responses for freelancer client problems',
    description: 'Stop losing money to scope creep, late payments, and difficult clients. Get a professional, ready-to-send response in under a minute.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  )
}
