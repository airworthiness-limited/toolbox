import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { MarketTable } from '@/components/market-table'

export const metadata: Metadata = {
  title: 'The Market | Airworthiness',
  description: 'Search 1,500+ UK CAA Part 145 approved maintenance organisations. Filter by country, rating class, and capabilities.',
}

export default async function MarketPage() {
  const supabase = await createClient()

  const { data: approvals } = await supabase
    .from('part145_approvals')
    .select('id, reference_number, organisation_name, status, city, state, country_code, website, issued_date, part145_ratings(id, rating_class, category, detail, base_maintenance, line_maintenance)')
    .order('organisation_name')

  return (
    <div className="min-h-screen">
      <section className="py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            The Market
          </h1>
          <p className="text-sm text-muted-foreground mt-3 max-w-2xl leading-relaxed">
            The Market by Airworthiness brings together those with something to sell and those looking to buy. We have developed the largest platform of airworthiness organisations approved to trade in the aviation market. Whether you need new floor panels, a hydraulic pump overhaul, a type training course, or support managing a maintenance programme, we can connect you with the right provider.
          </p>

          <div className="mt-8">
            <MarketTable approvals={approvals || []} />
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Data sourced from the UK Civil Aviation Authority Part 145 approved organisation register.
          </p>
        </div>
      </section>
    </div>
  )
}
