import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { REQUIRED_TRAINING, RECENCY_REQUIRED_DAYS, RECENCY_PERIOD_YEARS } from '@/lib/profile/constants'
import { MODULE_REQUIREMENTS, PART_66_MODULES, ESSAY_MODULES, PASS_MARK, PASS_VALIDITY_YEARS, isSameModuleEquivalent, getCrossModuleEquivalency } from '@/lib/progress/constants'
import type { TrainingStatus, RecencyStatus, TypeEndorsement } from '@/lib/profile/types'
import type { ModuleExamProgress } from '@/lib/progress/types'
import { ExternalTrainingForm } from './external-training-form'
import { LogoutButton } from '../dashboard/logout-button'

export const metadata: Metadata = { title: 'Profile | Airworthiness' }

// Handle backward compatibility: convert old string[] type_ratings to TypeEndorsement[]
function normaliseTypeRatings(raw: any): TypeEndorsement[] {
  if (!raw || !Array.isArray(raw)) return []
  return raw.map((item: any) => {
    if (typeof item === 'string') {
      return { rating: item, b1Date: null, b2Date: null, b3Date: null, cDate: null }
    }
    return item as TypeEndorsement
  })
}

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch profile first (needed for redirect check and aml_categories)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, aml_licence_number, aml_categories, type_ratings, aml_photo_path, aml_verified, is_public, competency_completed_at, created_at')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const selectedCategory = profile.aml_categories?.[0] || 'B1.1'

  // Run remaining queries in parallel -- none depend on each other
  const [
    { data: purchase },
    { data: certificates },
    { data: allLogbookEntries },
    { data: allProgress },
  ] = await Promise.all([
    supabase
      .from('purchases')
      .select('id')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('certificates')
      .select('token, issued_at, courses(slug, title)')
      .eq('user_id', user.id)
      .order('issued_at', { ascending: false }),
    supabase
      .from('logbook_entries')
      .select('task_date, status')
      .eq('user_id', user.id),
    supabase
      .from('module_exam_progress')
      .select('id, user_id, target_category, module_id, issue_date, mcq_score, essay_score, essay_score_2, essay_split, is_btc')
      .eq('user_id', user.id),
  ])

  // Fetch external training certificates
  const { data: externalCerts } = await supabase
    .from('external_training_certificates')
    .select('training_slug, completion_date, expiry_date, certificate_path')
    .eq('user_id', user.id)

  // Calculate training status (merge platform + external certificates)
  const now = new Date()
  const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate())

  const trainingStatuses: TrainingStatus[] = REQUIRED_TRAINING.map(training => {
    const cert = certificates?.find(c => (c.courses as any)?.slug === training.slug)
    const certDate = cert?.issued_at ? new Date(cert.issued_at) : null

    const extCert = externalCerts?.find(c => c.training_slug === training.slug)
    const extDate = extCert?.completion_date ? new Date(extCert.completion_date) : null

    // Use the most recent valid date from either source
    let effectiveDate: Date | null = null
    let effectiveDateStr: string | null = null
    if (certDate && extDate) {
      effectiveDate = certDate > extDate ? certDate : extDate
      effectiveDateStr = certDate > extDate ? cert!.issued_at : extCert!.completion_date
    } else if (certDate) {
      effectiveDate = certDate
      effectiveDateStr = cert!.issued_at
    } else if (extDate) {
      effectiveDate = extDate
      effectiveDateStr = extCert!.completion_date
    }

    return {
      slug: training.slug,
      label: training.label,
      certificateDate: effectiveDateStr,
      isCurrent: effectiveDate ? effectiveDate >= twoYearsAgo : false,
    }
  })

  const logbookCount = allLogbookEntries?.length ?? 0

  // Calculate recency as distinct task days within the recency period
  const periodStart = new Date(now.getFullYear() - RECENCY_PERIOD_YEARS, now.getMonth(), now.getDate())
  const recencyEntries = allLogbookEntries?.filter(e =>
    e.task_date >= periodStart.toISOString().split('T')[0] &&
    ['verified', 'draft', 'pending_verification'].includes(e.status)
  ) ?? []

  const uniqueTaskDays = new Set(recencyEntries.map(e => e.task_date)).size

  const recencyStatus: RecencyStatus = {
    totalDays: uniqueTaskDays,
    requiredDays: RECENCY_REQUIRED_DAYS,
    isCurrent: uniqueTaskDays >= RECENCY_REQUIRED_DAYS,
    periodStart: periodStart.toISOString().split('T')[0],
    periodEnd: now.toISOString().split('T')[0],
  }

  const progressRecords = (allProgress ?? []) as ModuleExamProgress[]
  const requiredModuleIds = MODULE_REQUIREMENTS[selectedCategory] ?? []

  function checkExpired(issueDate: string | null): boolean {
    if (!issueDate) return false
    const issue = new Date(issueDate)
    const expiryDate = new Date(issue)
    expiryDate.setFullYear(expiryDate.getFullYear() + PASS_VALIDITY_YEARS)
    return new Date() > expiryDate
  }

  // Count passed modules for the selected category
  let passedModules = 0
  for (const moduleId of requiredModuleIds) {
    const hasEssay = ESSAY_MODULES.includes(moduleId)

    let progress = progressRecords.find(
      p => p.module_id === moduleId && p.target_category === selectedCategory
    ) ?? null

    let equivalentSourceRecord: ModuleExamProgress | null = null

    if (!progress) {
      for (const record of progressRecords) {
        if (
          record.module_id === moduleId &&
          record.target_category !== selectedCategory &&
          record.mcq_score !== null &&
          record.mcq_score >= PASS_MARK &&
          isSameModuleEquivalent(record.target_category, selectedCategory, moduleId)
        ) {
          equivalentSourceRecord = record
          break
        }
      }
      if (!equivalentSourceRecord) {
        const crossRule = getCrossModuleEquivalency(moduleId, selectedCategory)
        if (crossRule) {
          for (const record of progressRecords) {
            if (
              record.module_id === crossRule.sourceModule &&
              crossRule.sourceCategories.includes(record.target_category) &&
              record.mcq_score !== null &&
              record.mcq_score >= PASS_MARK
            ) {
              equivalentSourceRecord = record
              break
            }
          }
        }
      }
    }

    const effectiveRecord = progress ?? equivalentSourceRecord
    if (!effectiveRecord) continue

    const isExpired = checkExpired(effectiveRecord.issue_date)
    if (isExpired) continue

    const mcqPassed = effectiveRecord.mcq_score !== null && effectiveRecord.mcq_score >= PASS_MARK
    const essayPassed = !hasEssay || (effectiveRecord.essay_score !== null && effectiveRecord.essay_score >= PASS_MARK)

    if (mcqPassed && essayPassed) passedModules++
  }

  const totalModules = requiredModuleIds.length
  const progressPercent = totalModules > 0 ? Math.round((passedModules / totalModules) * 100) : 0

  // Competency assessment — coming soon (feature disabled)
  const allTrainingCurrent = trainingStatuses.every(t => t.isCurrent)
  const allComplete = allTrainingCurrent && recencyStatus.isCurrent

  const fullName = profile.full_name ?? 'User'

  return (
    <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            {fullName}
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="rounded-xl border border-border p-6">
            <p className="text-sm text-muted-foreground">Module Exams ({selectedCategory})</p>
            <p className="text-3xl font-bold mt-1">{passedModules}/{totalModules}</p>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all ${progressPercent === 100 ? 'bg-green-500' : 'bg-amber-500'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{progressPercent}% complete</p>
          </div>
          <div className="rounded-xl border border-border p-6">
            <p className="text-sm text-muted-foreground">Logbook Tasks</p>
            <p className="text-3xl font-bold mt-1">{logbookCount}</p>
          </div>
        </div>

        {/* Recency - same format as logbook */}
        <div className="rounded-xl border border-border p-5 mb-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Recency (6 Months / 2 Years)
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tasks</span>
                <span className="text-sm font-bold text-foreground">{logbookCount} / 180</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                <div
                  style={{ width: `${Math.min(100, (logbookCount / 180) * 100)}%`, backgroundColor: logbookCount >= 180 ? '#22c55e' : '#3b82f6' }}
                  className="h-1.5 rounded-full"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Days</span>
                <span className="text-sm font-bold text-foreground">{recencyStatus.totalDays} / {recencyStatus.requiredDays}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                <div
                  style={{ width: `${Math.min(100, (recencyStatus.totalDays / recencyStatus.requiredDays) * 100)}%`, backgroundColor: recencyStatus.isCurrent ? '#22c55e' : '#3b82f6' }}
                  className="h-1.5 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>


        {/* Continuation Training */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Continuation Training</CardTitle>
            <CardDescription>Required to be completed within the last 2 years.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {trainingStatuses.map(training => {
                const extCert = externalCerts?.find(c => c.training_slug === training.slug)
                return (
                  <div key={training.slug} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-semibold">{training.label}</p>
                        {training.certificateDate ? (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Completed {new Date(training.certificateDate).toLocaleDateString('en-GB', {
                              day: 'numeric', month: 'long', year: 'numeric'
                            })}
                            {extCert?.expiry_date && (
                              <span className="text-muted-foreground"> · Expires {new Date(extCert.expiry_date).toLocaleDateString('en-GB', {
                                day: 'numeric', month: 'long', year: 'numeric'
                              })}</span>
                            )}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground mt-0.5">No certificate on record</p>
                        )}
                      </div>
                      <Badge variant={training.isCurrent ? 'default' : 'destructive'}>
                        {training.isCurrent ? 'Current' : 'Expired'}
                      </Badge>
                    </div>
                    <ExternalTrainingForm
                      slug={training.slug}
                      existingDate={extCert?.completion_date ?? null}
                      existingCertificatePath={extCert?.certificate_path ?? null}
                    />
                  </div>
                )
              })}
            </div>
            {!allTrainingCurrent && (
              <div className="mt-4">
                <Link href="/courses">
                  <Button size="sm">Complete Training</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Competency Assessment — Coming Soon */}
        <Card className="mb-4 opacity-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Competency Assessment
              <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">Coming Soon</span>
            </CardTitle>
            <CardDescription>
              A basic competency check covering core maintenance knowledge.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Task Logbook */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Aircraft Maintenance Digital Logbook</CardTitle>
            <CardDescription>
              Track your tasks in our Aircraft Maintenance Digital Logbook, in the format required by the Civil Aviation Authority. Tasks can be electronically verified, or printed to be signed manually, should they not have an Airworthiness account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {logbookCount > 0
                  ? `${logbookCount} tasks recorded`
                  : 'Record and verify your maintenance tasks'}
              </p>
              <Link href="/logbook">
                <Button variant="outline" size="sm">Open Logbook</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Delete Account */}
        <Card className="border-red-100">
          <CardHeader>
            <CardTitle className="text-base text-red-600">Delete Account</CardTitle>
            <CardDescription>
              Permanently delete your account and all associated data. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteAccountButton />
          </CardContent>
        </Card>

    </div>
  )
}

import { DeleteAccountButton } from './delete-account-button'
