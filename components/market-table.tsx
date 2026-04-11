'use client'

import { useState, useMemo, useRef, useEffect, Fragment } from 'react'

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

const RATING_SECTION_LABELS: Record<string, string> = {
  A: 'Aircraft Maintenance',
  B: 'Engine Maintenance',
  C: 'Component Maintenance',
  D: 'Non-Destructive Testing',
}

type Rating = {
  id: number
  rating_class: string
  category: string
  detail: string | null
  base_maintenance: boolean | null
  line_maintenance: boolean | null
}

type Approval = {
  id: number
  reference_number: string
  organisation_name: string
  status: string
  city: string | null
  state: string | null
  country_code: string
  website: string | null
  issued_date: string | null
  part145_ratings: Rating[]
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
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

const TRADING_AS_PATTERN = /\s+(?:t\/a|T\/A|d\/b\/a|D\/B\/A|dba|DBA|trading as|Trading As)\s+/

function splitRatingCode(detail: string): { text: string; code: string | null } {
  const m = detail.match(/^(.+?)\s*\(([A-Z0-9]+)\)\s*$/)
  if (m) return { text: m[1], code: m[2] }
  return { text: detail, code: null }
}

function parseOrgName(name: string): { legalName: string; tradingAs: string | null } {
  const match = name.match(TRADING_AS_PATTERN)
  if (!match) return { legalName: name, tradingAs: null }
  const idx = match.index!
  return {
    legalName: name.slice(0, idx),
    tradingAs: name.slice(idx + match[0].length),
  }
}

function ExpandedRow({ org }: { org: Approval }) {
  const ref = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (ref.current) setHeight(ref.current.scrollHeight)
  }, [])

  const ratingsByClass: Record<string, Rating[]> = {}
  for (const r of org.part145_ratings || []) {
    if (!ratingsByClass[r.rating_class]) ratingsByClass[r.rating_class] = []
    ratingsByClass[r.rating_class].push(r)
  }
  // Sort within each class: by category number (A1 before A2), then alphabetically by detail
  for (const cls of Object.keys(ratingsByClass)) {
    ratingsByClass[cls].sort((a, b) => {
      const aNum = parseInt(a.category.replace(/\D/g, '')) || 0
      const bNum = parseInt(b.category.replace(/\D/g, '')) || 0
      if (aNum !== bNum) return aNum - bNum
      return (a.detail || '').localeCompare(b.detail || '')
    })
  }

  return (
    <tr>
      <td colSpan={3} className="p-0">
        <div
          ref={ref}
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: height ? `${height}px` : '0px', opacity: height ? 1 : 0 }}
        >
          <div className="px-6 py-5 bg-muted/30 border-t">
            {/* Details row */}
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm mb-5">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Organisation</span>
                <p className="text-foreground">{parseOrgName(org.organisation_name).legalName}</p>
              </div>
              {parseOrgName(org.organisation_name).tradingAs && (
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Trading As</span>
                  <p className="text-foreground">{parseOrgName(org.organisation_name).tradingAs}</p>
                </div>
              )}
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Approval</span>
                <p className="text-foreground">{org.reference_number}</p>
              </div>
              {org.city && (
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">City</span>
                  <p className="text-foreground">{org.city}</p>
                </div>
              )}
              {org.state && (
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">State</span>
                  <p className="text-foreground">{titleCase(org.state)}</p>
                </div>
              )}
              {org.website && (
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Website</span>
                  <p>
                    <a
                      href={org.website.startsWith('http') ? org.website : `https://${org.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {org.website}
                    </a>
                  </p>
                </div>
              )}
            </div>

            {/* Ratings */}
            {(org.part145_ratings || []).length > 0 && (
              <div className="space-y-4">
                {(['A', 'B', 'C', 'D'] as const).map(cls => {
                  const classRatings = ratingsByClass[cls]
                  if (!classRatings || classRatings.length === 0) return null
                  return (
                    <div key={cls}>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left text-xs text-muted-foreground uppercase tracking-wide font-normal py-1.5 pr-4">
                                {RATING_SECTION_LABELS[cls]} ({classRatings.length})
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {classRatings.map(r => (
                              <tr key={r.id} className="border-b last:border-0">
                                <td className="py-1.5 pr-4 text-foreground">
                                  {r.detail ? (() => {
                                    const { text, code } = splitRatingCode(r.detail)
                                    return <>{text}{code && <span className="text-muted-foreground ml-1">({code})</span>}</>
                                  })() : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Part 147 Ratings */}
            {((org as any)._part147 || []).length > 0 && (() => {
              const p147 = (org as any)._part147 as Part147Approval['part147_ratings']
              const typeRatings = p147.filter(r => r.category === 'TYPE_TASK')
              const basicRatings = p147.filter(r => r.category === 'BASIC')

              return (
                <div className="space-y-4">
                  {typeRatings.length > 0 && (
                    <div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left text-xs text-muted-foreground uppercase tracking-wide font-normal py-1.5 pr-4">
                                Type Training ({typeRatings.length})
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {typeRatings.map(r => (
                              <tr key={r.id} className="border-b last:border-0">
                                <td className="py-1.5 pr-4 text-foreground">
                                  {r.type_name}
                                  <span className="text-muted-foreground ml-1">({r.licence}/{r.training_code})</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {basicRatings.length > 0 && (
                    <div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left text-xs text-muted-foreground uppercase tracking-wide font-normal py-1.5 pr-4">
                                Basic Training ({basicRatings.length})
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {basicRatings.map(r => (
                              <tr key={r.id} className="border-b last:border-0">
                                <td className="py-1.5 pr-4 text-foreground">
                                  {r.basic_scope}
                                  <span className="text-muted-foreground ml-1">({r.licence})</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      </td>
    </tr>
  )
}

const APPROVAL_TYPES = [
  { key: 'part145', label: 'Maintenance (Part 145)', hasData: true },
  { key: 'camo', label: 'Management (Part CAMO)', hasData: false },
  { key: 'part147', label: 'Aircraft Maintenance Training (Part 147)', hasData: true },
  { key: 'part21g', label: 'Production (Part 21G)', hasData: false },
  { key: 'part21j', label: 'Design (Part 21J)', hasData: false },
] as const

const PART145_CLASSES = [
  { key: 'all', label: 'All' },
  { key: 'A', label: 'Aircraft Maintenance (Class A)' },
  { key: 'B', label: 'Engine Maintenance (Class B)' },
  { key: 'C', label: 'Component Maintenance (Class C)' },
  { key: 'D', label: 'Non-Destructive Testing (Class D)' },
] as const

const SUBCATEGORIES: Record<string, { key: string; label: string }[]> = {
  A: [
    { key: 'A1', label: 'Complex Aircraft (A1)' },
    { key: 'A2', label: 'Non-Complex Aeroplane (A2)' },
    { key: 'A3', label: 'Non-Complex Helicopter (A3)' },
    { key: 'A4', label: 'Other Aircraft (A4)' },
  ],
  B: [
    { key: 'B1', label: 'Turbine Engine (B1)' },
    { key: 'B2', label: 'Piston Engine (B2)' },
    { key: 'B3', label: 'Auxiliary Power Unit (B3)' },
  ],
  C: [
    { key: 'C1', label: 'Air Conditioning and Pressurisation (C1)' },
    { key: 'C2', label: 'Auto Flight (C2)' },
    { key: 'C3', label: 'Communication/Navigation (C3)' },
    { key: 'C4', label: 'Doors/Hatches (C4)' },
    { key: 'C5', label: 'Electrical Power (C5)' },
    { key: 'C6', label: 'Equipment (C6)' },
    { key: 'C7', label: 'Engine/Auxiliary Power Unit (C7)' },
    { key: 'C8', label: 'Flight Controls (C8)' },
    { key: 'C9', label: 'Fuel (C9)' },
    { key: 'C10', label: 'Rotors (C10)' },
    { key: 'C11', label: 'Transmission (C11)' },
    { key: 'C12', label: 'Hydraulic (C12)' },
    { key: 'C13', label: 'Instruments (C13)' },
    { key: 'C14', label: 'Landing Gear (C14)' },
    { key: 'C15', label: 'Oxygen (C15)' },
    { key: 'C16', label: 'Propellers (C16)' },
    { key: 'C17', label: 'Pneumatic (C17)' },
    { key: 'C18', label: 'Ice, Rain and Fire Protection (C18)' },
    { key: 'C19', label: 'Windows (C19)' },
    { key: 'C20', label: 'Structural (C20)' },
    { key: 'C21', label: 'Water Ballast (C21)' },
    { key: 'C22', label: 'Propulsion Augmentation (C22)' },
  ],
  D: [
    { key: 'D1-PT', label: 'Liquid Penetrant (PT)' },
    { key: 'D1-MT', label: 'Magnetic Particle (MT)' },
    { key: 'D1-IRT', label: 'Thermography (IRT)' },
    { key: 'D1-ET', label: 'Eddy Current (ET)' },
    { key: 'D1-UT', label: 'Ultrasonic (UT)' },
    { key: 'D1-RT', label: 'Radiography (RT)' },
    { key: 'D1-ST', label: 'Shearography (ST)' },
  ],
}

type Part147Approval = {
  id: number
  reference_number: string
  organisation_name: string
  status: string
  city: string | null
  state: string | null
  country_code: string
  website: string | null
  issued_date: string | null
  part147_ratings: {
    id: number
    category: string
    licence: string
    training_code: string | null
    type_name: string | null
    basic_scope: string | null
  }[]
}

export function MarketTable({ approvals, part147Approvals = [] }: { approvals: Approval[]; part147Approvals?: Part147Approval[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('organisation_name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [approvalType, setApprovalType] = useState<string>('')
  const [ratingClassFilter, setRatingClassFilter] = useState<string>('all')
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    // Select data source based on approval type
    let list: any[]
    if (approvalType === 'part147') {
      list = part147Approvals.map(a => ({
        ...a,
        part145_ratings: [],
        _part147: a.part147_ratings,
      }))
    } else {
      list = [...approvals]
    }

    // Free-text search across all fields
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter(org => {
        const fields = [
          org.organisation_name,
          org.reference_number,
          org.city,
          org.state,
          COUNTRY_NAMES[org.country_code] || org.country_code,
          ...(org.part145_ratings || []).map(r => r.detail || ''),
        ]
        return fields.some(f => f && f.toLowerCase().includes(q))
      })
    }

    // Filter by rating class if Part 145 selected with a specific class
    if (approvalType === 'part145' && ratingClassFilter !== 'all') {
      if (subcategoryFilter !== 'all') {
        // Filter by specific subcategory
        if (ratingClassFilter === 'D') {
          // D class: filter by method keyword in the detail field
          const METHOD_KEYWORDS: Record<string, string[]> = {
            'D1-PT': ['PENETRANT', '(PT)'],
            'D1-MT': ['MAGNETIC', '(MT)'],
            'D1-IRT': ['THERMOGRAPH', '(IRT)'],
            'D1-ET': ['EDDY', '(ET)'],
            'D1-UT': ['ULTRASONIC', '(UT)'],
            'D1-RT': ['RADIOGRAPH', '(RT)'],
            'D1-ST': ['SHEAROGRAPH', '(ST)'],
          }
          const keywords = METHOD_KEYWORDS[subcategoryFilter] || []
          list = list.filter(org =>
            (org.part145_ratings || []).some(r =>
              r.rating_class === 'D' && r.detail && keywords.some(kw => r.detail!.toUpperCase().includes(kw))
            )
          )
        } else {
          // A/B/C: filter by category code
          list = list.filter(org =>
            (org.part145_ratings || []).some(r => r.category === subcategoryFilter)
          )
        }
      } else {
        list = list.filter(org =>
          (org.part145_ratings || []).some(r => r.rating_class === ratingClassFilter)
        )
      }
    }

    // Non-Part 145/147 types have no data yet
    if (approvalType && approvalType !== 'part145' && approvalType !== 'part147') {
      list = []
    }

    const dir = sortDir === 'asc' ? 1 : -1
    list.sort((a, b) => {
      let av: string, bv: string
      switch (sortKey) {
        case 'organisation_name': av = a.organisation_name; bv = b.organisation_name; break
        case 'reference_number': av = a.reference_number; bv = b.reference_number; break
        case 'country': av = COUNTRY_NAMES[a.country_code] || ''; bv = COUNTRY_NAMES[b.country_code] || ''; break
      }
      return av.localeCompare(bv) * dir
    })
    return list
  }, [approvals, part147Approvals, sortKey, sortDir, approvalType, ratingClassFilter, subcategoryFilter, searchQuery])

  return (
    <>
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setExpandedId(null) }}
          placeholder="Search organisations, aircraft, engines, locations..."
          className="w-full h-10 rounded-lg border border-input bg-transparent px-4 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          value={approvalType}
          onChange={e => {
            setApprovalType(e.target.value)
            setRatingClassFilter('all')
            setExpandedId(null)
          }}
          className={`flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${!approvalType ? 'text-muted-foreground' : ''}`}
        >
          <option value="" disabled hidden>Organisation Approval</option>
          {APPROVAL_TYPES.map(type => (
            <option key={type.key} value={type.key} disabled={!type.hasData}>
              {type.label}
            </option>
          ))}
        </select>

        {approvalType === 'part145' && (
          <select
            value={ratingClassFilter}
            onChange={e => {
              setRatingClassFilter(e.target.value)
              setSubcategoryFilter('all')
              setExpandedId(null)
            }}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {PART145_CLASSES.map(cls => (
              <option key={cls.key} value={cls.key}>{cls.label}</option>
            ))}
          </select>
        )}

        {approvalType === 'part145' && ratingClassFilter !== 'all' && SUBCATEGORIES[ratingClassFilter] && (
          <select
            value={subcategoryFilter}
            onChange={e => {
              setSubcategoryFilter(e.target.value)
              setExpandedId(null)
            }}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All</option>
            {SUBCATEGORIES[ratingClassFilter].map(sub => (
              <option key={sub.key} value={sub.key}>{sub.label}</option>
            ))}
          </select>
        )}
      </div>


      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-[55%] text-left font-medium text-muted-foreground px-4 py-3 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('organisation_name')}>
                  Organisation<SortIcon active={sortKey === 'organisation_name'} dir={sortDir} />
                </th>
                <th className="w-[20%] text-left font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('reference_number')}>
                  Approval(s)<SortIcon active={sortKey === 'reference_number'} dir={sortDir} />
                </th>
                <th className="w-[25%] text-left font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('country')}>
                  Country<SortIcon active={sortKey === 'country'} dir={sortDir} />
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(org => (
                <Fragment key={org.id}>
                  <tr
                    className={`border-b last:border-0 cursor-pointer transition-colors ${expandedId === org.id ? 'bg-muted/40' : 'hover:bg-muted/30'}`}
                    onClick={() => setExpandedId(expandedId === org.id ? null : org.id)}
                  >
                    <td className="px-4 py-3 overflow-hidden">
                      <span className="font-medium text-foreground block truncate">
                        {parseOrgName(org.organisation_name).legalName}
                      </span>
                      <span className="sm:hidden block text-xs text-muted-foreground mt-0.5 truncate">
                        {org.reference_number}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell overflow-hidden truncate">
                      {org.reference_number}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell overflow-hidden truncate">
                      {COUNTRY_NAMES[org.country_code] || org.country_code || '—'}
                    </td>
                  </tr>
                  {expandedId === org.id && <ExpandedRow key={`exp-${org.id}`} org={org} />}
                </Fragment>
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
        {sorted.length === approvals.length
          ? `${approvals.length.toLocaleString()} organisations`
          : `${sorted.length.toLocaleString()} of ${approvals.length.toLocaleString()} organisations`}
      </p>
    </>
  )
}
