import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { CookieBanner } from '@/components/cookie-banner'
import { ScrollToTop } from '@/components/scroll-to-top'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Airworthiness',
  description: 'Continuation training, digital logbooks, and module exam tracking for UK Aircraft Maintenance Licence holders.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          {children}
          <CookieBanner />
          <ScrollToTop />
        </ThemeProvider>
      </body>
    </html>
  )
}
