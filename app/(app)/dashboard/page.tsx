import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { REQUIRED_TRAINING, RECENCY_TASK_THRESHOLD, RECENCY_REQUIRED_DAYS, RECENCY_PERIOD_YEARS } from '@/lib/profile/constants'
import { MODULE_REQUIREMENTS, ESSAY_MODULES, PASS_MARK, PASS_VALIDITY_YEARS, isSameModuleEquivalent, getCrossModuleEquivalency } from '@/lib/progress/constants'
import type { TrainingStatus, RecencyStatus, TypeEndorsement } from '@/lib/profile/types'
import type { ModuleExamProgress } from '@/lib/progress/types'

export const metadata: Metadata = { title: 'Dashboard | Airworthiness' }

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
    .select('id, full_name, role, aml_licence_number, aml_categories, type_ratings, aml_photo_path, aml_verified, is_public, competency_completed_at, created_at, dashboard_widgets')
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

  // Fetch 10 most recent logbook entries
  const { data: recentEntries } = await supabase
    .from('logbook_entries')
    .select('id, task_date, aircraft_type, aircraft_registration, description, status')
    .eq('user_id', user.id)
    .order('task_date', { ascending: false })
    .limit(10)

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

  // Count passed exams for the selected category (MCQ and essay counted separately)
  let passedExams = 0
  let totalExams = 0
  for (const moduleId of requiredModuleIds) {
    const hasEssay = ESSAY_MODULES.includes(moduleId)
    totalExams++ // MCQ exam
    if (hasEssay) totalExams++ // Essay exam

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
    if (!effectiveRecord) {
      continue
    }

    const isExpired = checkExpired(effectiveRecord.issue_date)
    if (isExpired) continue

    const mcqPassed = effectiveRecord.mcq_score !== null && effectiveRecord.mcq_score >= PASS_MARK
    if (mcqPassed) passedExams++

    if (hasEssay) {
      const essayPassed = effectiveRecord.essay_score !== null && effectiveRecord.essay_score >= PASS_MARK
      if (essayPassed) passedExams++
    }
  }

  const progressPercent = totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 0

  // Competency assessment — coming soon (feature disabled)
  const allTrainingCurrent = trainingStatuses.every(t => t.isCurrent)
  const allComplete = allTrainingCurrent && recencyStatus.isCurrent

  const fullName = profile.full_name ?? 'User'

  return (
    <DashboardEditor
      fullName={fullName}
      selectedCategory={selectedCategory}
      passedExams={passedExams}
      totalExams={totalExams}
      progressPercent={progressPercent}
      logbookCount={logbookCount}
      recencyTotalTasks={logbookCount}
      recencyTaskThreshold={RECENCY_TASK_THRESHOLD}
      recencyTotalDays={recencyStatus.totalDays}
      recencyRequiredDays={recencyStatus.requiredDays}
      recencyIsCurrent={recencyStatus.isCurrent}
      trainingStatuses={trainingStatuses}
      allTrainingCurrent={allTrainingCurrent}
      externalCerts={externalCerts ?? []}
      recentEntries={recentEntries ?? []}
      widgetConfig={profile.dashboard_widgets as any}
    />
  )
}

import { DashboardEditor } from './dashboard-editor'
