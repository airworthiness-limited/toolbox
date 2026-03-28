import type { Metadata } from 'next'
import { Alexandria } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { CookieBanner } from '@/components/cookie-banner'
import { AdPlaceholder } from '@/components/ad-placeholder'

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
        <Navbar />
        <main>
          {children}
          <div className="max-w-6xl mx-auto px-4 py-4">
            <AdPlaceholder format="banner" />
          </div>
        </main>
        <Footer />
        <CookieBanner />
      </body>
    </html>
  )
}
