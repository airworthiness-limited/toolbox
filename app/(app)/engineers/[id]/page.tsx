import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { REQUIRED_TRAINING, RECENCY_REQUIRED_DAYS, RECENCY_PERIOD_YEARS, AML_CATEGORIES } from '@/lib/profile/constants'

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch public profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, aml_licence_number, aml_categories, type_ratings, is_public, competency_completed_at, created_at')
    .eq('id', id)
    .eq('is_public', true)
    .single()

  if (!profile) notFound()

  // Fetch certificates for training status
  const { data: certificates } = await supabase
    .from('certificates')
    .select('issued_at, courses(slug, title)')
    .eq('user_id', profile.id)
    .order('issued_at', { ascending: false })

  const now = new Date()
  const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate())

  const trainingStatuses = REQUIRED_TRAINING.map(training => {
    const cert = certificates?.find(c => (c.courses as any)?.slug === training.slug)
    const certDate = cert?.issued_at ? new Date(cert.issued_at) : null
    return {
      label: training.label,
      isCurrent: certDate ? certDate >= twoYearsAgo : false,
    }
  })

  // Calculate recency as distinct task days
  const periodStart = new Date(now.getFullYear() - RECENCY_PERIOD_YEARS, now.getMonth(), now.getDate())
  const { data: logbookEntries } = await supabase
    .from('logbook_entries')
    .select('task_date')
    .eq('user_id', profile.id)
    .gte('task_date', periodStart.toISOString().split('T')[0])
    .in('status', ['verified'])

  const uniqueTaskDays = new Set(logbookEntries?.map(e => e.task_date) ?? []).size
  const recencyMet = uniqueTaskDays >= RECENCY_REQUIRED_DAYS

  const allTrainingCurrent = trainingStatuses.every(t => t.isCurrent)
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="min-h-screen aw-gradient">
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="bg-white rounded-xl border p-8 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl text-gray-900">
                {profile.full_name ?? 'Aircraft Engineer'}
              </h1>
              {memberSince && (
                <p className="text-xs text-gray-400 mt-2">Member since {memberSince}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              {allTrainingCurrent && recencyMet && (
                <Badge className="bg-green-100 text-green-800 border-green-200">Verified Engineer</Badge>
              )}
              {profile.competency_completed_at && (
                <Badge variant="outline">Competency Assessed</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Licence Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Licence Details</CardTitle>
            </CardHeader>
            <CardContent>
              {profile.aml_licence_number ? (
                <p className="text-sm text-gray-700 mb-3">
                  Licence: <span className="font-mono font-medium">{profile.aml_licence_number}</span>
                </p>
              ) : (
                <p className="text-sm text-gray-400 mb-3">Licence number not provided</p>
              )}

              {profile.aml_categories && profile.aml_categories.length > 0 ? (
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">Categories</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.aml_categories.map((cat: string) => (
                      <Badge key={cat} variant="outline" className="text-xs">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No categories listed</p>
              )}
            </CardContent>
          </Card>

          {/* Training Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Training Currency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {trainingStatuses.map(t => (
                  <div key={t.label} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{t.label}</span>
                    <Badge variant={t.isCurrent ? 'default' : 'destructive'} className="text-xs">
                      {t.isCurrent ? 'Current' : 'Expired'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Type Endorsements */}
          {profile.type_ratings && profile.type_ratings.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Type Endorsements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 font-semibold text-gray-700">Aircraft Type</th>
                        <th className="text-center py-2 px-2 font-semibold text-gray-700 w-[100px]">B1</th>
                        <th className="text-center py-2 px-2 font-semibold text-gray-700 w-[100px]">B2</th>
                        <th className="text-center py-2 px-2 font-semibold text-gray-700 w-[100px]">B3</th>
                        <th className="text-center py-2 px-2 font-semibold text-gray-700 w-[100px]">C</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.type_ratings.map((item: any, i: number) => {
                        const rating = typeof item === 'string' ? item : item.rating
                        const b1 = typeof item === 'string' ? null : item.b1Date
                        const b2 = typeof item === 'string' ? null : item.b2Date
                        const b3 = typeof item === 'string' ? null : item.b3Date
                        const c = typeof item === 'string' ? null : item.cDate
                        const formatDate = (d: string | null) =>
                          d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null
                        return (
                          <tr key={i} className="border-b border-gray-100">
                            <td className="py-2 px-2 font-medium">{rating}</td>
                            <td className="py-2 px-2 text-center">
                              {b1 ? (
                                <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">{formatDate(b1)}</span>
                              ) : (
                                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">N/A</span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-center">
                              {b2 ? (
                                <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">{formatDate(b2)}</span>
                              ) : (
                                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">N/A</span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-center">
                              {b3 ? (
                                <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">{formatDate(b3)}</span>
                              ) : (
                                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">N/A</span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-center">
                              {c ? (
                                <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">{formatDate(c)}</span>
                              ) : (
                                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">N/A</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recency */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Maintenance Recency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-gray-900">{uniqueTaskDays} days</span>
                <Badge variant={recencyMet ? 'default' : 'destructive'}>
                  {recencyMet ? 'Current' : 'Not Met'}
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${recencyMet ? 'bg-green-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min((uniqueTaskDays / RECENCY_REQUIRED_DAYS) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {uniqueTaskDays} of {RECENCY_REQUIRED_DAYS} task days in the last {RECENCY_PERIOD_YEARS} years
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Profile verified by Airworthiness Limited
          </p>
        </div>
      </div>
    </div>
  )
}
