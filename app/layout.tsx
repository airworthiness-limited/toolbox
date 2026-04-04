import type { Metadata } from 'next'
import { Alexandria } from 'next/font/google'
import './globals.css'
import { CookieBanner } from '@/components/cookie-banner'
import { ScrollToTop } from '@/components/scroll-to-top'
import { ThemeProvider } from '@/components/theme-provider'

const alexandria = Alexandria({
  subsets: ['latin'],
  variable: '--font-alexandria',
  weight: ['300', '400', '500', '600', '700', '800'],
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${alexandria.variable} antialiased`} style={{ fontFamily: 'var(--font-alexandria), sans-serif' }}>
        <ThemeProvider>
          {children}
          <CookieBanner />
          <ScrollToTop />
        </ThemeProvider>
      </body>
    </html>
  )
}
