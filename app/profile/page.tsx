import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { REQUIRED_TRAINING, RECENCY_REQUIRED_HOURS, RECENCY_PERIOD_YEARS } from '@/lib/profile/constants'
import type { Profile, TrainingStatus, RecencyStatus } from '@/lib/profile/types'
import { ProfileEditor } from './profile-editor'
import { PublicToggle } from './public-toggle'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, bio, aml_licence_number, aml_categories, type_ratings, is_public, competency_completed_at, created_at')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Fetch certificates with course slugs for training currency check
  const { data: certificates } = await supabase
    .from('certificates')
    .select('issued_at, courses(slug, title)')
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false })

  // Calculate training status
  const now = new Date()
  const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate())

  const trainingStatuses: TrainingStatus[] = REQUIRED_TRAINING.map(training => {
    const cert = certificates?.find(c => (c.courses as any)?.slug === training.slug)
    const certDate = cert?.issued_at ? new Date(cert.issued_at) : null
    return {
      slug: training.slug,
      label: training.label,
      certificateDate: cert?.issued_at ?? null,
      isCurrent: certDate ? certDate >= twoYearsAgo : false,
    }
  })

  // Calculate recency from logbook entries
  const periodStart = new Date(now.getFullYear() - RECENCY_PERIOD_YEARS, now.getMonth(), now.getDate())
  const { data: logbookEntries } = await supabase
    .from('logbook_entries')
    .select('duration_hours')
    .eq('user_id', user.id)
    .gte('task_date', periodStart.toISOString().split('T')[0])
    .in('status', ['verified', 'draft', 'pending_verification'])

  const totalHours = logbookEntries?.reduce((sum, e) => sum + Number(e.duration_hours), 0) ?? 0

  const recencyStatus: RecencyStatus = {
    totalHours,
    requiredHours: RECENCY_REQUIRED_HOURS,
    isCurrent: totalHours >= RECENCY_REQUIRED_HOURS,
    periodStart: periodStart.toISOString().split('T')[0],
    periodEnd: now.toISOString().split('T')[0],
  }

  // Check competency assessment status
  const competencyPassed = !!profile.competency_completed_at

  // Can go public: must have competency assessment completed
  const canGoPublic = competencyPassed

  const allTrainingCurrent = trainingStatuses.every(t => t.isCurrent)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Engineer Profile</h1>
            <p className="text-gray-500 mt-1">Your qualifications, training currency, and recency at a glance.</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">← Dashboard</Button>
          </Link>
        </div>

        {/* Overall Status Banner */}
        <div className={`rounded-xl border p-6 mb-8 ${
          allTrainingCurrent && recencyStatus.isCurrent && competencyPassed
            ? 'bg-green-50 border-green-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {allTrainingCurrent && recencyStatus.isCurrent && competencyPassed ? '✅' : '⚠️'}
            </span>
            <div>
              <p className="font-semibold text-gray-900">
                {allTrainingCurrent && recencyStatus.isCurrent && competencyPassed
                  ? 'Profile Complete — Ready for recruiters'
                  : 'Action Required — Complete your profile'}
              </p>
              <p className="text-sm text-gray-600 mt-0.5">
                {!allTrainingCurrent && 'Some continuation training is expired. '}
                {!recencyStatus.isCurrent && 'Recency requirement not met. '}
                {!competencyPassed && 'Competency assessment not completed. '}
                {allTrainingCurrent && recencyStatus.isCurrent && competencyPassed && 'All checks passed. You can list your profile publicly.'}
              </p>
            </div>
          </div>
        </div>

        {/* Training Currency */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Continuation Training</CardTitle>
            <CardDescription>EASA requires these to be completed within the last 2 years.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trainingStatuses.map(training => (
                <div key={training.slug}
                  className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{training.label}</p>
                    {training.certificateDate ? (
                      <p className="text-sm text-gray-500 mt-0.5">
                        Completed {new Date(training.certificateDate).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 mt-0.5">No certificate on record</p>
                    )}
                  </div>
                  <Badge variant={training.isCurrent ? 'default' : 'destructive'}>
                    {training.isCurrent ? 'Current' : 'Expired'}
                  </Badge>
                </div>
              ))}
            </div>
            {!allTrainingCurrent && (
              <div className="mt-4">
                <Link href="/courses">
                  <Button size="sm">Complete Training →</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AML Categories & Type Ratings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Aircraft Maintenance Licence</CardTitle>
            <CardDescription>Your Part 66 licence categories and aircraft type ratings.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileEditor
              profile={{
                aml_licence_number: profile.aml_licence_number ?? '',
                aml_categories: profile.aml_categories ?? [],
                type_ratings: profile.type_ratings ?? [],
                bio: profile.bio ?? '',
              }}
            />
          </CardContent>
        </Card>

        {/* Recency */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Maintenance Recency</CardTitle>
            <CardDescription>
              6 months of maintenance experience ({RECENCY_REQUIRED_HOURS} hours) in the preceding {RECENCY_PERIOD_YEARS} years.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-3xl font-bold text-gray-900">{recencyStatus.totalHours.toFixed(0)}</p>
                <p className="text-sm text-gray-500">of {recencyStatus.requiredHours} hours required</p>
              </div>
              <Badge variant={recencyStatus.isCurrent ? 'default' : 'destructive'}>
                {recencyStatus.isCurrent ? 'Recency Met' : 'Not Met'}
              </Badge>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  recencyStatus.isCurrent ? 'bg-green-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min((recencyStatus.totalHours / recencyStatus.requiredHours) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Period: {new Date(recencyStatus.periodStart).toLocaleDateString('en-GB')} – {new Date(recencyStatus.periodEnd).toLocaleDateString('en-GB')}
            </p>

            {!recencyStatus.isCurrent && (
              <p className="text-sm text-gray-500 mt-3">
                Log your maintenance work to build up recency hours.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Competency Assessment */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Competency Assessment</CardTitle>
            <CardDescription>
              Complete a basic competency check to list your profile publicly. This gives recruiters
              confidence you would pass their internal assessment during onboarding.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {competencyPassed ? (
              <div className="flex items-center gap-3">
                <Badge>Passed</Badge>
                <p className="text-sm text-gray-500">
                  Completed {new Date(profile.competency_completed_at!).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-4">
                  10 multiple-choice questions covering core maintenance knowledge. You need 80% to pass.
                </p>
                <Link href="/profile/assessment">
                  <Button>Take Assessment →</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Public Profile Toggle */}
        <Card>
          <CardHeader>
            <CardTitle>Public Profile</CardTitle>
            <CardDescription>
              List your profile on the engineer marketplace so recruiters can find you.
              {!canGoPublic && ' Complete the competency assessment first.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PublicToggle isPublic={profile.is_public ?? false} canGoPublic={canGoPublic} />
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
