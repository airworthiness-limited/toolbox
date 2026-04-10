'use client'

import { useState, useMemo, useRef, useEffect } from 'react'

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

const RATING_CLASS_LABELS: Record<string, string> = {
  A: 'Aircraft',
  B: 'Engines',
  C: 'Components',
  D: 'Specialised Services',
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

function formatLongDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return dateStr
  }
}

type SortKey = 'organisation_name' | 'reference_number' | 'city' | 'state' | 'country'
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

  return (
    <tr>
      <td colSpan={6} className="p-0">
        <div
          ref={ref}
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: height ? `${height}px` : '0px', opacity: height ? 1 : 0 }}
        >
          <div className="px-6 py-5 bg-muted/30 border-t">
            {/* Details row */}
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm mb-5">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Approval</span>
                <p className="text-foreground">{org.reference_number}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Status</span>
                <p className="text-foreground">{org.status}</p>
              </div>
              {org.issued_date && (
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Issued</span>
                  <p className="text-foreground">{formatLongDate(org.issued_date)}</p>
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
                      <h4 className="text-xs font-semibold text-foreground mb-2">
                        Class {cls} — {RATING_CLASS_LABELS[cls]}
                        <span className="ml-1 font-normal text-muted-foreground">({classRatings.length})</span>
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left font-medium text-muted-foreground py-1.5 pr-4">Category</th>
                              <th className="text-left font-medium text-muted-foreground py-1.5 pr-4">Rating(s)</th>
                              {cls === 'A' && (
                                <>
                                  <th className="text-left font-medium text-muted-foreground py-1.5 pr-4">Base</th>
                                  <th className="text-left font-medium text-muted-foreground py-1.5">Line</th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {classRatings.map(r => (
                              <tr key={r.id} className="border-b last:border-0">
                                <td className="py-1.5 pr-4 text-foreground">{r.category}</td>
                                <td className="py-1.5 pr-4 text-muted-foreground">{r.detail || '—'}</td>
                                {cls === 'A' && (
                                  <>
                                    <td className="py-1.5 pr-4">{r.base_maintenance ? 'Yes' : '—'}</td>
                                    <td className="py-1.5">{r.line_maintenance ? 'Yes' : '—'}</td>
                                  </>
                                )}
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
          </div>
        </div>
      </td>
    </tr>
  )
}

const APPROVAL_TYPES = [
  { key: 'part145', label: 'Maintenance (Part 145)', hasData: true },
  { key: 'camo', label: 'Management (Part CAMO)', hasData: false },
  { key: 'part147', label: 'Aircraft Maintenance Training (Part 147)', hasData: false },
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

export function MarketTable({ approvals }: { approvals: Approval[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('organisation_name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [approvalType, setApprovalType] = useState<string>('')
  const [ratingClassFilter, setRatingClassFilter] = useState<string>('all')
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all')

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    let list = [...approvals]

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

    // Non-Part 145 types (except blank/all) have no data yet
    if (approvalType && approvalType !== 'part145') {
      list = []
    }

    const dir = sortDir === 'asc' ? 1 : -1
    list.sort((a, b) => {
      let av: string, bv: string
      switch (sortKey) {
        case 'organisation_name': av = a.organisation_name; bv = b.organisation_name; break
        case 'reference_number': av = a.reference_number; bv = b.reference_number; break
        case 'city': av = a.city || ''; bv = b.city || ''; break
        case 'state': av = a.state ? titleCase(a.state) : ''; bv = b.state ? titleCase(b.state) : ''; break
        case 'country': av = COUNTRY_NAMES[a.country_code] || ''; bv = COUNTRY_NAMES[b.country_code] || ''; break
      }
      return av.localeCompare(bv) * dir
    })
    return list
  }, [approvals, sortKey, sortDir, approvalType, ratingClassFilter])

  return (
    <>
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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left font-medium text-muted-foreground px-4 py-3 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('organisation_name')}>
                  Organisation<SortIcon active={sortKey === 'organisation_name'} dir={sortDir} />
                </th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('reference_number')}>
                  Approval(s)<SortIcon active={sortKey === 'reference_number'} dir={sortDir} />
                </th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('city')}>
                  City<SortIcon active={sortKey === 'city'} dir={sortDir} />
                </th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('state')}>
                  State<SortIcon active={sortKey === 'state'} dir={sortDir} />
                </th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('country')}>
                  Country<SortIcon active={sortKey === 'country'} dir={sortDir} />
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(org => (
                <>
                  <tr
                    key={org.id}
                    className={`border-b last:border-0 cursor-pointer transition-colors ${expandedId === org.id ? 'bg-muted/40' : 'hover:bg-muted/30'}`}
                    onClick={() => setExpandedId(expandedId === org.id ? null : org.id)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground">
                        {org.organisation_name}
                      </span>
                      <span className="sm:hidden block text-xs text-muted-foreground mt-0.5">
                        {org.reference_number}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {org.reference_number}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {org.city || '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {org.state ? titleCase(org.state) : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {COUNTRY_NAMES[org.country_code] || org.country_code || '—'}
                    </td>
                  </tr>
                  {expandedId === org.id && <ExpandedRow key={`exp-${org.id}`} org={org} />}
                </>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
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
