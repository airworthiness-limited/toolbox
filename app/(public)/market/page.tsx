import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'The Market | Airworthiness',
  description: 'Search 1,500+ UK CAA Part 145 approved maintenance organisations. Filter by country, rating class, and capabilities.',
}

const COUNTRY_NAMES: Record<string, string> = {
  AE: 'United Arab Emirates', AT: 'Austria', AU: 'Australia', BE: 'Belgium', BG: 'Bulgaria',
  BH: 'Bahrain', BR: 'Brazil', CA: 'Canada', CH: 'Switzerland', CN: 'China',
  CR: 'Costa Rica', CY: 'Cyprus', CZ: 'Czech Republic', DE: 'Germany', DK: 'Denmark',
  EE: 'Estonia', ES: 'Spain', FI: 'Finland', FR: 'France', GB: 'United Kingdom',
  GR: 'Greece', HK: 'Hong Kong', HR: 'Croatia', HU: 'Hungary', ID: 'Indonesia',
  IE: 'Ireland', IL: 'Israel', IN: 'India', IS: 'Iceland', IT: 'Italy',
  JO: 'Jordan', JP: 'Japan', KR: 'South Korea', KW: 'Kuwait', LT: 'Lithuania',
  LU: 'Luxembourg', LV: 'Latvia', MA: 'Morocco', MT: 'Malta', MU: 'Mauritius',
  MX: 'Mexico', MY: 'Malaysia', NL: 'Netherlands', NO: 'Norway', NZ: 'New Zealand',
  OM: 'Oman', PE: 'Peru', PH: 'Philippines', PK: 'Pakistan', PL: 'Poland',
  PT: 'Portugal', QA: 'Qatar', RO: 'Romania', RS: 'Serbia', SA: 'Saudi Arabia',
  SE: 'Sweden', SG: 'Singapore', SI: 'Slovenia', SK: 'Slovakia', TH: 'Thailand',
  TR: 'Turkey', TW: 'Taiwan', UA: 'Ukraine', US: 'United States', ZA: 'South Africa',
}

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const q = (params.q as string) || ''
  const country = (params.country as string) || ''

  const supabase = await createClient()

  let query = supabase
    .from('part145_approvals')
    .select('id, reference_number, organisation_name, status, city, country_code, website')

  if (q) {
    query = query.or(`organisation_name.ilike.%${q}%,reference_number.ilike.%${q}%`)
  }

  if (country) {
    query = query.eq('country_code', country)
  }

  const { data: approvals } = await query.order('organisation_name')

  // Get unique countries for filter
  const { data: countries } = await supabase
    .from('part145_approvals')
    .select('country_code')
    .not('country_code', 'eq', '')
    .order('country_code')

  const uniqueCountries = [...new Set((countries || []).map(c => c.country_code))].filter(c => c && /^[A-Z]{2}$/.test(c))

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

          {/* Search + Filters */}
          <form method="GET" action="/market" className="mt-6 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search by name or approval number..."
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <select
              name="country"
              defaultValue={country}
              className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">All countries</option>
              {uniqueCountries.map(c => (
                <option key={c} value={c}>{COUNTRY_NAMES[c] || c}</option>
              ))}
            </select>
            <Button type="submit" size="sm" className="h-9 px-4">
              Search
            </Button>
          </form>

          {/* Active filters */}
          {(q || country) && (
            <div className="mt-3 flex items-center gap-2">
              {q && <Badge variant="secondary">Search: {q}</Badge>}
              {country && <Badge variant="secondary">Country: {COUNTRY_NAMES[country] || country}</Badge>}
              <Link href="/market" className="text-xs text-muted-foreground hover:underline">
                Clear filters
              </Link>
            </div>
          )}

          {/* Results */}
          <div className="mt-8 bg-card rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Organisation</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Approval(s)</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {(approvals || []).map(org => (
                    <tr key={org.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/market/${encodeURIComponent(org.reference_number)}`}
                          className="font-medium text-foreground hover:underline"
                        >
                          {org.organisation_name}
                        </Link>
                        <span className="sm:hidden block text-xs text-muted-foreground mt-0.5">
                          {org.reference_number}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                        {org.reference_number}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {COUNTRY_NAMES[org.country_code] || org.country_code || '—'}
                      </td>
                    </tr>
                  ))}
                  {(!approvals || approvals.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                        No organisations found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Result count */}
          <p className="mt-4 text-xs text-muted-foreground">
            {(approvals || []).length.toLocaleString()} organisation{(approvals || []).length !== 1 ? 's' : ''}
          </p>

          {/* Source attribution */}
          <p className="mt-6 text-xs text-muted-foreground">
            Data sourced from the UK Civil Aviation Authority Part 145 approved organisation register.
          </p>
        </div>
      </section>
    </div>
  )
}
