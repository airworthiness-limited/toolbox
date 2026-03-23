import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { REQUIRED_TRAINING, RECENCY_REQUIRED_HOURS, RECENCY_PERIOD_YEARS, AML_CATEGORIES } from '@/lib/profile/constants'

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch public profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, bio, aml_licence_number, aml_categories, type_ratings, is_public, competency_completed_at, created_at')
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

  // Calculate recency
  const periodStart = new Date(now.getFullYear() - RECENCY_PERIOD_YEARS, now.getMonth(), now.getDate())
  const { data: logbookEntries } = await supabase
    .from('logbook_entries')
    .select('duration_hours')
    .eq('user_id', profile.id)
    .gte('task_date', periodStart.toISOString().split('T')[0])
    .in('status', ['verified'])

  const totalHours = logbookEntries?.reduce((sum, e) => sum + Number(e.duration_hours), 0) ?? 0
  const recencyMet = totalHours >= RECENCY_REQUIRED_HOURS

  const allTrainingCurrent = trainingStatuses.every(t => t.isCurrent)
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="bg-white rounded-xl border p-8 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profile.full_name ?? 'Aircraft Engineer'}
              </h1>
              {profile.bio && (
                <p className="text-gray-500 mt-2 max-w-lg">{profile.bio}</p>
              )}
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

          {/* Type Ratings */}
          {profile.type_ratings && profile.type_ratings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Aircraft Type Ratings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {profile.type_ratings.map((type: string) => (
                    <Badge key={type} variant="outline" className="text-xs">
                      {type}
                    </Badge>
                  ))}
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
                <span className="text-2xl font-bold text-gray-900">{totalHours.toFixed(0)}h</span>
                <Badge variant={recencyMet ? 'default' : 'destructive'}>
                  {recencyMet ? 'Current' : 'Not Met'}
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${recencyMet ? 'bg-green-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min((totalHours / RECENCY_REQUIRED_HOURS) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {totalHours.toFixed(0)} of {RECENCY_REQUIRED_HOURS} hours in the last {RECENCY_PERIOD_YEARS} years
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
