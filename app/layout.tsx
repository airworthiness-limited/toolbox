import type { Metadata } from 'next'
import Script from 'next/script'
import { Alexandria } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { CookieBanner } from '@/components/cookie-banner'
import { ScrollToTop } from '@/components/scroll-to-top'


const alexandria = Alexandria({
  subsets: ['latin'],
  variable: '--font-alexandria',
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Airworthiness Limited',
  description: 'Continuation training, digital logbooks, and module exam tracking for UK Aircraft Maintenance Licence holders.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${alexandria.variable} antialiased`} style={{ fontFamily: 'var(--font-alexandria), sans-serif' }}>
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7968073666840898"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
        <Navbar />
        <main>
          {children}
        </main>
        <Footer />
        <CookieBanner />
        <ScrollToTop />
      </body>
    </html>
  )
}
