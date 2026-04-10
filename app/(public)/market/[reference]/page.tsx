import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type Props = {
  params: Promise<{ reference: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { reference } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('part145_approvals')
    .select('organisation_name')
    .eq('reference_number', decodeURIComponent(reference))
    .single()

  if (!data) return { title: 'Not Found | Airworthiness' }

  return {
    title: `${data.organisation_name} | Part 145 Directory | Airworthiness`,
    description: `Part 145 approval details for ${data.organisation_name}. View ratings, capabilities, and location.`,
  }
}

const RATING_CLASS_LABELS: Record<string, string> = {
  A: 'Aircraft',
  B: 'Engines',
  C: 'Components',
  D: 'Specialised Services',
}

function formatLongDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return dateStr
  }
}

export default async function OrgDetailPage({ params }: Props) {
  const { reference } = await params
  const ref = decodeURIComponent(reference)

  const supabase = await createClient()

  const { data: org } = await supabase
    .from('part145_approvals')
    .select('*')
    .eq('reference_number', ref)
    .single()

  if (!org) notFound()

  const { data: ratings } = await supabase
    .from('part145_ratings')
    .select('*')
    .eq('approval_id', org.id)
    .order('rating_class')
    .order('category')

  const ratingsByClass: Record<string, typeof ratings> = {}
  for (const r of ratings || []) {
    if (!ratingsByClass[r.rating_class]) ratingsByClass[r.rating_class] = []
    ratingsByClass[r.rating_class]!.push(r)
  }

  return (
    <div className="min-h-screen">
      <section className="py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-6">
          {/* Back link */}
          <Link href="/market" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            &larr; Back to directory
          </Link>

          {/* Header */}
          <div className="mt-4">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              {org.organisation_name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="secondary">{org.reference_number}</Badge>
              <Badge variant={org.status === 'ACTIVE' ? 'default' : 'destructive'}>
                {org.status}
              </Badge>
              {org.country_code && org.country_code.length <= 3 && (
                <Badge variant="outline">{org.country_code}</Badge>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {org.city && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Location</p>
                <p className="text-sm text-foreground">{org.city}</p>
                {org.postcode && <p className="text-sm text-muted-foreground">{org.postcode}</p>}
              </div>
            )}
            {org.issued_date && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Issued</p>
                <p className="text-sm text-foreground">{formatLongDate(org.issued_date)}</p>
              </div>
            )}
            {org.website && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Website</p>
                <a
                  href={org.website.startsWith('http') ? org.website : `https://${org.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {org.website}
                </a>
              </div>
            )}
          </div>

          {/* Ratings */}
          {(ratings || []).length > 0 && (
            <div className="mt-10">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Ratings & Capabilities
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {(ratings || []).length} rating{(ratings || []).length !== 1 ? 's' : ''} across {Object.keys(ratingsByClass).length} class{Object.keys(ratingsByClass).length !== 1 ? 'es' : ''}.
              </p>

              <div className="space-y-6">
                {(['A', 'B', 'C', 'D'] as const).map(cls => {
                  const classRatings = ratingsByClass[cls]
                  if (!classRatings || classRatings.length === 0) return null

                  return (
                    <div key={cls} className="bg-card rounded-xl border p-5">
                      <h3 className="text-sm font-semibold text-foreground mb-3">
                        Class {cls} — {RATING_CLASS_LABELS[cls]}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          ({classRatings.length})
                        </span>
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left font-medium text-muted-foreground py-2 pr-4">Category</th>
                              <th className="text-left font-medium text-muted-foreground py-2 pr-4">Rating(s)</th>
                              {cls === 'A' && (
                                <>
                                  <th className="text-left font-medium text-muted-foreground py-2 pr-4">Base</th>
                                  <th className="text-left font-medium text-muted-foreground py-2 pr-4">Line</th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {classRatings.map(r => (
                              <tr key={r.id} className="border-b last:border-0">
                                <td className="py-2 pr-4 text-foreground">{r.category}</td>
                                <td className="py-2 pr-4 text-muted-foreground">{r.detail || '—'}</td>
                                {cls === 'A' && (
                                  <>
                                    <td className="py-2 pr-4">{r.base_maintenance ? 'Yes' : '—'}</td>
                                    <td className="py-2 pr-4">{r.line_maintenance ? 'Yes' : '—'}</td>
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
            </div>
          )}

          {/* Source */}
          <p className="mt-10 text-xs text-muted-foreground">
            Data sourced from the UK Civil Aviation Authority. Last updated: {org.source_date || 'Unknown'}.
          </p>
        </div>
      </section>
    </div>
  )
}
