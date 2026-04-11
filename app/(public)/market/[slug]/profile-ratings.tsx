'use client'

import { useState } from 'react'

const RATING_SECTION_LABELS: Record<string, string> = {
  A: 'Aircraft Maintenance',
  B: 'Engine Maintenance',
  C: 'Component Maintenance',
  D: 'Non-Destructive Testing',
}

function splitRatingCode(detail: string): { text: string; code: string | null } {
  const m = detail.match(/^(.+?)\s*\(([A-Z0-9]+)\)\s*$/)
  if (m) return { text: m[1], code: m[2] }
  return { text: detail, code: null }
}

function CollapsibleSection({ title, count, children, defaultOpen = true }: {
  title: string; count?: number; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 text-left text-xs text-muted-foreground uppercase tracking-wide font-normal py-1.5 pr-4 hover:text-foreground transition-colors">
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
    <div className="mb-6">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 text-left text-sm font-semibold text-foreground mb-2 hover:text-foreground/80 transition-colors">
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        {title}
        {badge && <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md bg-muted text-xs font-medium">{badge}</span>}
      </button>
      {open && <div className="pl-3 border-l-2 border-muted space-y-4">{children}</div>}
    </div>
  )
}

type Rating = { id: string; rating_class: string; category: string; detail: string | null }
type Part147Rating = { id: string; category: string; licence: string; training_code: string | null; type_name: string | null; basic_scope: string | null }

const PART21G_LABELS: Record<string, string> = {
  A1: 'Large Aeroplanes', A2: 'Small Aeroplanes', A3: 'Large Helicopters', A4: 'Small Helicopters',
  A5: 'Gyroplanes', A6: 'Sailplanes', A7: 'Motor Gliders', A8: 'Manned Balloons',
  A9: 'Airships', A10: 'Light Sport Aeroplanes', A11: 'Very Light Aeroplanes', A12: 'Other',
  B1: 'Turbine Engines', B2: 'Piston Engines', B3: 'APUs', B4: 'Propellers',
  C1: 'Appliances', C2: 'Parts', D1: 'Maintenance', D2: 'Issue of Permit to Fly',
}

type Part21GRating = { id: string; category: string; scope_description: string | null }
type Part21JRating = { id: string; rating_type: string; rating_value: string }

export function ProfileRatings({ part145Ref, part147Ref, part21gRef, part21jRef, ratings, part147Ratings, part21gRatings = [], part21jRatings = [] }: {
  part145Ref: string
  part147Ref: string | null
  part21gRef: string | null
  part21jRef: string | null
  ratings: Rating[]
  part147Ratings: Part147Rating[]
  part21gRatings?: Part21GRating[]
  part21jRatings?: Part21JRating[]
}) {
  const ratingsByClass: Record<string, Rating[]> = {}
  for (const r of ratings) {
    if (!ratingsByClass[r.rating_class]) ratingsByClass[r.rating_class] = []
    ratingsByClass[r.rating_class].push(r)
  }
  // Sort within each class
  for (const cls of Object.keys(ratingsByClass)) {
    ratingsByClass[cls].sort((a, b) => {
      const aNum = parseInt(a.category.replace(/\D/g, '')) || 0
      const bNum = parseInt(b.category.replace(/\D/g, '')) || 0
      if (aNum !== bNum) return aNum - bNum
      return (a.detail || '').localeCompare(b.detail || '')
    })
  }

  const basicRatings = part147Ratings.filter(r => r.category === 'BASIC')
  const typeRatings = part147Ratings.filter(r => r.category === 'TYPE_TASK')

  return (
    <div className="bg-card rounded-xl border p-6">
      {/* Part 145: Maintenance */}
      {ratings.length > 0 && (
        <CollapsibleGroup title={part145Ref}>
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

      {/* Part 147: Training */}
      {part147Ratings.length > 0 && (
        <CollapsibleGroup title={part147Ref || 'Training'}>
          {/* Basic Training */}
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
      )}

      {/* Part 21G: Production */}
      {part21gRatings.length > 0 && (
        <CollapsibleGroup title={part21gRef || 'Production'}>
          <CollapsibleSection title="Scope of Work" count={part21gRatings.length}>
            <table className="w-full text-sm">
              <tbody>
                {part21gRatings.map(r => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-1.5 pr-4 text-foreground">
                      {PART21G_LABELS[r.category] || r.category}
                      <span className="text-muted-foreground ml-1">({r.category})</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CollapsibleSection>
        </CollapsibleGroup>
      )}

      {/* Part 21J: Design */}
      {part21jRatings.length > 0 && (() => {
        const productClasses = part21jRatings.filter(r => r.rating_type === 'product_class')
        const activities = part21jRatings.filter(r => r.rating_type === 'activity')
        return (
          <CollapsibleGroup title={part21jRef || 'Design'}>
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
          </CollapsibleGroup>
        )
      })()}
    </div>
  )
}
