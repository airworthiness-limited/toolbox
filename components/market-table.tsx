'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

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

type Approval = {
  id: number
  reference_number: string
  organisation_name: string
  status: string
  city: string | null
  country_code: string
  website: string | null
}

type SortKey = 'organisation_name' | 'reference_number' | 'country'
type SortDir = 'asc' | 'desc'

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg className={`inline-block w-3 h-3 ml-1 ${active ? 'text-foreground' : 'text-muted-foreground/40'}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}>
      {dir === 'asc' || !active
        ? <path d="M6 2 L6 10 M3 5 L6 2 L9 5" />
        : <path d="M6 10 L6 2 M3 7 L6 10 L9 7" />
      }
    </svg>
  )
}

export function MarketTable({ approvals }: { approvals: Approval[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('organisation_name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    const list = [...approvals]
    const dir = sortDir === 'asc' ? 1 : -1

    list.sort((a, b) => {
      let av: string, bv: string
      switch (sortKey) {
        case 'organisation_name':
          av = a.organisation_name
          bv = b.organisation_name
          break
        case 'reference_number':
          av = a.reference_number
          bv = b.reference_number
          break
        case 'country':
          av = COUNTRY_NAMES[a.country_code] || a.country_code || ''
          bv = COUNTRY_NAMES[b.country_code] || b.country_code || ''
          break
      }
      return av.localeCompare(bv) * dir
    })

    return list
  }, [approvals, sortKey, sortDir])

  return (
    <>
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th
                  className="text-left font-medium text-muted-foreground px-4 py-3 cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => toggleSort('organisation_name')}
                >
                  Organisation
                  <SortIcon active={sortKey === 'organisation_name'} dir={sortDir} />
                </th>
                <th
                  className="text-left font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => toggleSort('reference_number')}
                >
                  Approval(s)
                  <SortIcon active={sortKey === 'reference_number'} dir={sortDir} />
                </th>
                <th
                  className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => toggleSort('country')}
                >
                  Location
                  <SortIcon active={sortKey === 'country'} dir={sortDir} />
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(org => (
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
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    No organisations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        {approvals.length.toLocaleString()} organisations
      </p>
    </>
  )
}
