export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { getDb } from '@/lib/postgres/server'
import nextDynamic from 'next/dynamic'

const MarketMap = nextDynamic(() => import('@/components/market-map').then(m => m.MarketMap), {
  ssr: false,
  loading: () => <div className="h-[600px] rounded-xl border bg-muted/30 flex items-center justify-center text-muted-foreground">Loading map...</div>,
})

export const metadata: Metadata = {
  title: 'Organisation Map | Airworthiness',
  description: 'Interactive map of 1,500+ UK CAA Part 145 approved maintenance organisations worldwide.',
}

export default async function MarketMapPage() {
  const db = getDb()

  const { rows: organisations } = await db.query(`
    SELECT id, reference_number, organisation_name, city, country_code, latitude, longitude
    FROM part145_approvals
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    ORDER BY organisation_name
  `)

  return (
    <div className="min-h-screen">
      <section className="py-12 lg:py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">Organisation Map</h1>
          <p className="text-muted-foreground mb-8">
            Explore {organisations.length.toLocaleString()} Part 145 approved maintenance organisations worldwide.
          </p>

          <MarketMap organisations={organisations} />

          <div className="mt-6 text-center">
            <a href="/market" className="text-sm text-primary hover:underline">
              ← Back to table view
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
