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

function CollapsibleSection({ title, count, children, defaultOpen = true }: {
  title: string; count?: number; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 text-left text-xs text-muted-foreground uppercase tracking-wide font-normal py-1.5 pr-4 hover:text-foreground transition-colors"
      >
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        {title}{count !== undefined ? ` (${count})` : ''}
      </button>
      {open && children}
    </div>
  )
}

function CollapsibleGroup({ title, badge, children, defaultOpen = true }: {
  title: string; badge?: string; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 text-left text-sm font-semibold text-foreground mb-2 hover:text-foreground/80 transition-colors"
      >
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        {title}
        {badge && (
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md bg-muted text-xs font-medium">{badge}</span>
        )}
      </button>
      {open && (
        <div className="pl-3 border-l-2 border-muted space-y-4">
          {children}
        </div>
      )}
    </div>
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
            {/* Organisation details */}
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
              {org.city && (
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">City</span>
                  <p className="text-foreground">{org.city}</p>
                </div>
              )}
              {org.website && (
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Website</span>
                  <p>
                    <a href={org.website.startsWith('http') ? org.website : `https://${org.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {org.website}
                    </a>
                  </p>
                </div>
              )}
            </div>

            {/* Part 145: Maintenance */}
            {(org.part145_ratings || []).length > 0 && (
              <CollapsibleGroup title="Maintenance" badge={org.reference_number}>
                {(['A', 'B', 'C', 'D'] as const).map(cls => {
                  const classRatings = ratingsByClass[cls]
                  if (!classRatings || classRatings.length === 0) return null
                  return (
                    <CollapsibleSection key={cls} title={RATING_SECTION_LABELS[cls]} count={classRatings.length}>
                      <table className="w-full text-sm">
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
                    </CollapsibleSection>
                  )
                })}
              </CollapsibleGroup>
            )}

            {/* Part 147: Aircraft Maintenance Training Organisation Approval */}
            {(((org as any)._part147 || (org as any).part147_ratings || []).length > 0) && (() => {
              const p147 = ((org as any)._part147 || (org as any).part147_ratings || []) as Part147Approval['part147_ratings']
              const typeRatings = p147.filter(r => r.category === 'TYPE_TASK')
              const basicRatings = p147.filter(r => r.category === 'BASIC')

              return (
                <CollapsibleGroup title="Training" badge={(org as any).part147_ref}>
                    {/* Basic Training first */}
                    {basicRatings.length > 0 && (() => {
                      const scopeMap = new Map<string, Set<string>>()
                      const scopeOrder = ['Aeroplane Turbine', 'Aeroplane Piston', 'Helicopter Turbine', 'Helicopter Piston', 'Avionics']
                      for (const r of basicRatings) {
                        if (!r.basic_scope) continue
                        if (!scopeMap.has(r.basic_scope)) scopeMap.set(r.basic_scope, new Set())
                        scopeMap.get(r.basic_scope)!.add(r.licence)
                      }
                      const scopes = Array.from(scopeMap.entries()).sort((a, b) => {
                        const ai = scopeOrder.indexOf(a[0])
                        const bi = scopeOrder.indexOf(b[0])
                        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
                      })
                      return (
                        <CollapsibleSection title="Basic Training" count={scopes.length}>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left text-xs text-muted-foreground font-normal py-1.5 pr-4"></th>
                                <th className="text-center text-xs text-muted-foreground font-normal py-1.5 w-12">A</th>
                                <th className="text-center text-xs text-muted-foreground font-normal py-1.5 w-12">B</th>
                              </tr>
                            </thead>
                            <tbody>
                              {scopes.map(([scope, licences]) => (
                                <tr key={scope} className="border-b last:border-0">
                                  <td className="py-1.5 pr-4 text-foreground">{scope}</td>
                                  <td className="py-1.5 text-center">{licences.has('A') ? 'Yes' : '—'}</td>
                                  <td className="py-1.5 text-center">{licences.has('B1') || licences.has('B2') || licences.has('B3') ? 'Yes' : '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </CollapsibleSection>
                      )
                    })()}

                    {/* Type Training */}
                    {typeRatings.length > 0 && (() => {
                      const typeMap = new Map<string, Set<string>>()
                      for (const r of typeRatings) {
                        if (!r.type_name) continue
                        if (!typeMap.has(r.type_name)) typeMap.set(r.type_name, new Set())
                        typeMap.get(r.type_name)!.add(r.licence)
                      }
                      const types = Array.from(typeMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))
                      return (
                        <CollapsibleSection title="Type Training" count={types.length}>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left text-xs text-muted-foreground font-normal py-1.5 pr-4"></th>
                                <th className="text-center text-xs text-muted-foreground font-normal py-1.5 w-12">B1</th>
                                <th className="text-center text-xs text-muted-foreground font-normal py-1.5 w-12">B2</th>
                                <th className="text-center text-xs text-muted-foreground font-normal py-1.5 w-12">C</th>
                              </tr>
                            </thead>
                            <tbody>
                              {types.map(([name, licences]) => (
                                <tr key={name} className="border-b last:border-0">
                                  <td className="py-1.5 pr-4 text-foreground">{name}</td>
                                  <td className="py-1.5 text-center">{licences.has('B1') ? 'Yes' : '—'}</td>
                                  <td className="py-1.5 text-center">{licences.has('B2') ? 'Yes' : '—'}</td>
                                  <td className="py-1.5 text-center">{licences.has('C') ? 'Yes' : '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </CollapsibleSection>
                      )
                    })()}
                </CollapsibleGroup>
              )
            })()}

            {/* Part 21G: Production */}
            {(org as any).part21g_ref && (
              <CollapsibleGroup title={(org as any).part21g_ref} defaultOpen={false}>
                <p className="text-sm text-muted-foreground py-2">Production Organisation Approval — expand row on profile page for full scope of work</p>
              </CollapsibleGroup>
            )}

            {/* Part 21J: Design */}
            {((org as any).part21j_ref || ((org as any).part21j_ratings || []).length > 0) && (() => {
              const p21j = ((org as any).part21j_ratings || []) as { id: number; rating_type: string; rating_value: string }[]
              const productClasses = p21j.filter(r => r.rating_type === 'product_class')
              const activities = p21j.filter(r => r.rating_type === 'activity')
              return (
                <CollapsibleGroup title={(org as any).part21j_ref || 'Design'} defaultOpen={false}>
                  {productClasses.length > 0 && (
                    <CollapsibleSection title="Product Classes" count={productClasses.length}>
                      <table className="w-full text-sm">
                        <tbody>
                          {productClasses.map(r => (
                            <tr key={r.id} className="border-b last:border-0">
                              <td className="py-1.5 pr-4 text-foreground">{r.rating_value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CollapsibleSection>
                  )}
                  {activities.length > 0 && (
                    <CollapsibleSection title="Activities" count={activities.length}>
                      <table className="w-full text-sm">
                        <tbody>
                          {activities.map(r => (
                            <tr key={r.id} className="border-b last:border-0">
                              <td className="py-1.5 pr-4 text-foreground">{r.rating_value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CollapsibleSection>
                  )}
                  {p21j.length === 0 && (
                    <p className="text-sm text-muted-foreground py-2">Design Organisation Approval — view profile for full details</p>
                  )}
                </CollapsibleGroup>
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
  { key: 'part21g', label: 'Production (Part 21G)', hasData: true },
  { key: 'part21j', label: 'Design (Part 21J)', hasData: true },
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

const PART21G_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'A1', label: 'Large Aeroplanes (A1)' },
  { key: 'A2', label: 'Small Aeroplanes (A2)' },
  { key: 'A3', label: 'Large Helicopters (A3)' },
  { key: 'A4', label: 'Small Helicopters (A4)' },
  { key: 'A5', label: 'Gyroplanes (A5)' },
  { key: 'A6', label: 'Sailplanes (A6)' },
  { key: 'A7', label: 'Motor Gliders (A7)' },
  { key: 'A8', label: 'Manned Balloons (A8)' },
  { key: 'A9', label: 'Airships (A9)' },
  { key: 'A10', label: 'Light Sport Aeroplanes (A10)' },
  { key: 'A11', label: 'Very Light Aeroplanes (A11)' },
  { key: 'A12', label: 'Other (A12)' },
  { key: 'B1', label: 'Turbine Engines (B1)' },
  { key: 'B2', label: 'Piston Engines (B2)' },
  { key: 'B3', label: 'APUs (B3)' },
  { key: 'B4', label: 'Propellers (B4)' },
  { key: 'C1', label: 'Appliances (C1)' },
  { key: 'C2', label: 'Parts (C2)' },
  { key: 'D1', label: 'Maintenance (D1)' },
  { key: 'D2', label: 'Issue of Permit to Fly (D2)' },
] as const

const PART21J_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'CS-23', label: 'Small Aeroplanes (CS-23)' },
  { key: 'CS-25', label: 'Large Aeroplanes (CS-25)' },
  { key: 'Balloons', label: 'Balloons' },
  { key: 'Major Changes', label: 'Major Changes' },
  { key: 'Minor Changes', label: 'Minor Changes' },
  { key: 'Major Repairs', label: 'Major Repairs' },
  { key: 'Minor Repairs', label: 'Minor Repairs' },
  { key: 'STC', label: 'Supplemental Type Certificates (STC)' },
  { key: 'TC', label: 'Type Certificates (TC)' },
  { key: 'Permit to Fly', label: 'Permit to Fly' },
  { key: 'Flight Conditions', label: 'Flight Conditions' },
] as const

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

export function MarketTable({ approvals, part147OnlyApprovals = [], part21gOnlyApprovals = [], part21jOnlyApprovals = [], onOrgExpand }: { approvals: Approval[]; part147OnlyApprovals?: Part147Approval[]; part21gOnlyApprovals?: any[]; part21jOnlyApprovals?: any[]; onOrgExpand?: (orgId: number | null) => void }) {
  const [sortKey, setSortKey] = useState<SortKey>('organisation_name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [approvalType, setApprovalType] = useState<string>('')
  const [ratingClassFilter, setRatingClassFilter] = useState<string>('all')
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [part21gCategoryFilter, setPart21gCategoryFilter] = useState('all')
  const [part21jCategoryFilter, setPart21jCategoryFilter] = useState('all')

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
    if (approvalType === 'part21g') {
      // Show Part 145 orgs that have Part 21G + Part 21G-only orgs
      const seen21g = new Set<string>()
      const linked = approvals.filter((a: any) => {
        if (!a.part21g_ref || seen21g.has(a.part21g_ref)) return false
        seen21g.add(a.part21g_ref)
        return true
      })
      const p21gonly = part21gOnlyApprovals.map(a => ({
        ...a,
        part145_ratings: [],
      }))
      list = [...linked, ...p21gonly]

      // Filter by Part 21G category if selected
      if (part21gCategoryFilter !== 'all') {
        list = list.filter(org => {
          const ratings = (org as any).part21g_ratings || []
          return ratings.some((r: any) => r.category === part21gCategoryFilter)
        })
      }
    } else if (approvalType === 'part21j') {
      // Show Part 145 orgs that have Part 21J + Part 21J-only orgs
      const seen21j = new Set<string>()
      const linked = approvals.filter((a: any) => {
        if (!a.part21j_ref || seen21j.has(a.part21j_ref)) return false
        seen21j.add(a.part21j_ref)
        return true
      })
      const p21jonly = part21jOnlyApprovals.map(a => ({
        ...a,
        part145_ratings: [],
      }))
      list = [...linked, ...p21jonly]

      // Filter by Part 21J category if selected
      if (part21jCategoryFilter !== 'all') {
        list = list.filter(org => {
          const ratings = (org as any).part21j_ratings || []
          return ratings.some((r: any) => r.rating_value === part21jCategoryFilter)
        })
      }
    } else if (approvalType === 'part147') {
      // Show Part 145 orgs that also have Part 147 (dedup by part147_ref)
      const seen147 = new Set<string>()
      const linked = approvals.filter((a: any) => {
        if (!a.part147_ref || seen147.has(a.part147_ref)) return false
        seen147.add(a.part147_ref)
        return true
      }).map((a: any) => ({
        ...a,
        _part147: a.part147_ratings || [],
      }))
      // Add Part 147-only orgs (not linked to any Part 145)
      const p147only = part147OnlyApprovals.map(a => ({
        ...a,
        part145_ratings: [],
        _part147: a.part147_ratings,
      }))
      list = [...linked, ...p147only]
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
          (org as any).part147_ref || '',
          (org as any).part21g_ref || '',
          (org as any).part21j_ref || '',
          org.city,
          COUNTRY_NAMES[org.country_code] || org.country_code,
          ...(org.part145_ratings || []).map((r: any) => r.detail || ''),
          ...((org as any).part147_ratings || (org as any)._part147 || []).map((r: any) => r.type_name || r.basic_scope || ''),
          ...((org as any).part21j_ratings || []).map((r: any) => r.rating_value || ''),
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
            (org.part145_ratings || []).some((r: any) =>
              r.rating_class === 'D' && r.detail && keywords.some((kw: string) => r.detail!.toUpperCase().includes(kw))
            )
          )
        } else {
          // A/B/C: filter by category code
          list = list.filter(org =>
            (org.part145_ratings || []).some((r: any) => r.category === subcategoryFilter)
          )
        }
      } else {
        list = list.filter(org =>
          (org.part145_ratings || []).some((r: any) => r.rating_class === ratingClassFilter)
        )
      }
    }

    // Non-Part 145/147/21G/21J types have no data yet
    if (approvalType && approvalType !== 'part145' && approvalType !== 'part147' && approvalType !== 'part21g' && approvalType !== 'part21j') {
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
  }, [approvals, part147OnlyApprovals, part21gOnlyApprovals, part21jOnlyApprovals, sortKey, sortDir, approvalType, ratingClassFilter, subcategoryFilter, part21gCategoryFilter, part21jCategoryFilter, searchQuery])

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
            setPart21gCategoryFilter('all')
            setPart21jCategoryFilter('all')
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

        {approvalType === 'part21g' && (
          <select
            value={part21gCategoryFilter}
            onChange={e => {
              setPart21gCategoryFilter(e.target.value)
              setExpandedId(null)
            }}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {PART21G_CATEGORIES.map(cat => (
              <option key={cat.key} value={cat.key}>{cat.label}</option>
            ))}
          </select>
        )}

        {approvalType === 'part21j' && (
          <select
            value={part21jCategoryFilter}
            onChange={e => {
              setPart21jCategoryFilter(e.target.value)
              setExpandedId(null)
            }}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {PART21J_CATEGORIES.map(cat => (
              <option key={cat.key} value={cat.key}>{cat.label}</option>
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
                    onClick={() => {
                      const newId = expandedId === org.id ? null : org.id
                      setExpandedId(newId)
                      onOrgExpand?.(newId)
                    }}
                  >
                    <td className="px-4 py-3 overflow-hidden">
                      <span className="font-medium text-foreground block truncate">
                        {parseOrgName(org.organisation_name).legalName}
                      </span>
                      <span className="sm:hidden block text-xs text-muted-foreground mt-0.5 truncate">
                        {org.reference_number}{(org as any).part147_ref ? ` / ${(org as any).part147_ref}` : ''}{(org as any).part21g_ref ? ` / ${(org as any).part21g_ref}` : ''}{(org as any).part21j_ref ? ` / ${(org as any).part21j_ref}` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="grid grid-cols-2 gap-1 justify-items-center">
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md bg-muted text-foreground text-[11px] font-medium">
                          {org.reference_number}
                        </span>
                        {(org as any).part147_ref && (
                          <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md bg-muted text-foreground text-[11px] font-medium">
                            {(org as any).part147_ref}
                          </span>
                        )}
                        {(org as any).part21g_ref && (
                          <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md bg-muted text-foreground text-[11px] font-medium">
                            {(org as any).part21g_ref}
                          </span>
                        )}
                        {(org as any).part21j_ref && (
                          <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md bg-muted text-foreground text-[11px] font-medium">
                            {(org as any).part21j_ref}
                          </span>
                        )}
                      </div>
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
