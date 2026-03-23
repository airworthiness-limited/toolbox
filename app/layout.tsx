import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/navbar'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '700', '900'],
})

export const metadata: Metadata = {
  title: 'Airworthiness Limited — Aircraft Engineer Marketplace',
  description: 'Continuation training, digital logbooks, and recruiter-ready profiles for aircraft maintenance engineers.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  )
}