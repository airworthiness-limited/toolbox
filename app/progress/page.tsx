import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  PART_66_MODULES,
  MODULE_REQUIREMENTS,
  PROGRESS_CATEGORIES,
  ESSAY_MODULES,
  PASS_MARK,
  PASS_VALIDITY_YEARS,
  getCrossModuleEquivalency,
  isSameModuleEquivalent,
} from '@/lib/progress/constants'
import type { ModuleExamProgress, ExamRow } from '@/lib/progress/types'
import { ProgressTracker } from './progress-tracker'
import { AdPlaceholder } from '@/components/ad-placeholder'

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const selectedCategory = params.category || 'B1.1'

  // Fetch all progress for this user
  const { data: allProgress } = await supabase
    .from('module_exam_progress')
    .select('*')
    .eq('user_id', user.id)

  const progressRecords = (allProgress ?? []) as ModuleExamProgress[]

  // Check if an issue date is more than 10 years old
  function checkExpired(issueDate: string | null): boolean {
    if (!issueDate) return false
    const issue = new Date(issueDate)
    const expiryDate = new Date(issue)
    expiryDate.setFullYear(expiryDate.getFullYear() + PASS_VALIDITY_YEARS)
    return new Date() > expiryDate
  }

  // Get required modules for the selected category
  const requiredModuleIds = MODULE_REQUIREMENTS[selectedCategory] ?? []

  // Build exam rows: each module gets an MCQ row, essay modules also get an Essay row
  const examRows: ExamRow[] = []

  for (const moduleId of requiredModuleIds) {
    const moduleDef = PART_66_MODULES.find(m => m.id === moduleId)!
    const hasEssay = ESSAY_MODULES.includes(moduleId)

    // Find direct progress for this category
    let progress = progressRecords.find(
      p => p.module_id === moduleId && p.target_category === selectedCategory
    ) ?? null

    let equivalentFrom: ExamRow['equivalentFrom'] = null
    let equivalentSourceRecord: ModuleExamProgress | null = null

    if (!progress) {
      // Check same-module equivalency from other categories
      for (const record of progressRecords) {
        if (
          record.module_id === moduleId &&
          record.target_category !== selectedCategory &&
          record.mcq_score !== null &&
          record.mcq_score >= PASS_MARK &&
          isSameModuleEquivalent(record.target_category, selectedCategory, moduleId)
        ) {
          equivalentFrom = {
            sourceModule: moduleId,
            sourceCategory: record.target_category,
            description: `Passed at ${record.target_category} level (higher or equal)`,
          }
          equivalentSourceRecord = record
          break
        }
      }

      // Check cross-module equivalencies
      if (!equivalentFrom) {
        const crossRule = getCrossModuleEquivalency(moduleId, selectedCategory)
        if (crossRule) {
          for (const record of progressRecords) {
            if (
              record.module_id === crossRule.sourceModule &&
              crossRule.sourceCategories.includes(record.target_category) &&
              record.mcq_score !== null &&
              record.mcq_score >= PASS_MARK
            ) {
              equivalentFrom = {
                sourceModule: crossRule.sourceModule,
                sourceCategory: record.target_category,
                description: crossRule.description,
              }
              equivalentSourceRecord = record
              break
            }
          }
        }
      }
    }

    // Check expiry: direct progress or equivalent source record
    const isExpired = progress
      ? checkExpired(progress.issue_date)
      : equivalentSourceRecord
        ? checkExpired(equivalentSourceRecord.issue_date)
        : false

    // MCQ row (always)
    examRows.push({
      moduleId,
      title: moduleDef.title,
      examType: 'mcq',
      canSplitEssay: false,
      progress,
      equivalentFrom,
      isExpired,
    })

    // Essay row (only for essay modules)
    if (hasEssay) {
      examRows.push({
        moduleId,
        title: moduleDef.title,
        examType: 'essay',
        canSplitEssay: moduleId === '7A' || moduleId === '7B',
        progress,
        equivalentFrom,
        isExpired,
      })
    }
  }

  // Calculate progress: count passed exams out of total exam rows (expired entries do not count)
  const passedCount = examRows.filter(row => {
    if (row.isExpired) return false
    if (row.equivalentFrom) return true
    if (!row.progress) return false

    if (row.examType === 'mcq') {
      return row.progress.mcq_score !== null && row.progress.mcq_score >= PASS_MARK
    } else {
      // Essay exam
      const essayPassed = row.progress.essay_score !== null && row.progress.essay_score >= PASS_MARK
      if (row.progress.essay_split) {
        const essay2Passed = row.progress.essay_score_2 !== null && row.progress.essay_score_2 >= PASS_MARK
        return essayPassed && essay2Passed
      }
      return essayPassed
    }
  }).length

  const totalExams = examRows.length
  const progressPercent = totalExams > 0 ? Math.round((passedCount / totalExams) * 100) : 0

  // Check if user has BTC set for this category
  const hasBtc = progressRecords.some(
    p => p.target_category === selectedCategory && p.is_btc
  )

  // Category description
  const categoryDescription = PROGRESS_CATEGORIES.find(c => c.value === selectedCategory)?.label ?? ''

  const mcqRows = examRows.filter(r => r.examType === 'mcq')
  const essayRows = examRows.filter(r => r.examType === 'essay')

  // Group categories by aircraft type
  const categoryGroups = [
    { label: 'Aeroplane \u2013 Turbine', cats: ['A1', 'B1.1'] },
    { label: 'Aeroplane \u2013 Piston', cats: ['A2', 'B1.2', 'B3'] },
    { label: 'Helicopter \u2013 Turbine', cats: ['A3', 'B1.3'] },
    { label: 'Helicopter \u2013 Piston', cats: ['A4', 'B1.4'] },
    { label: 'Avionics', cats: ['B2'] },
  ]

  return (
    <div className="min-h-screen aw-gradient">
      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl text-white">Exam Progress</h1>
          <p className="text-white/60 mt-1">
            Track your Aircraft Maintenance Licence (Part 66) subject module examination progress.
          </p>
        </div>

        {/* BTC strip */}
        <div className="bg-white rounded-xl px-5 py-3 mb-4">
          <BtcToggle
            initialValue={hasBtc}
            selectedCategory={selectedCategory}
            userId={user.id}
          />
        </div>

        {/* Two columns: Categories (wider) | Progress (narrower) */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 mb-6">

          {/* Categories */}
          <div className="bg-white rounded-xl p-5 space-y-3">
            {categoryGroups.map(group => (
              <div key={group.label}>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">{group.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {group.cats.map(catValue => (
                    <Link
                      key={catValue}
                      href={`/progress?category=${catValue}`}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                        selectedCategory === catValue
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {catValue}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Progress */}
          <div className="bg-white rounded-xl p-5 flex flex-col justify-center">
            <p className="text-4xl font-bold text-gray-900">{progressPercent}%</p>
            <p className="text-sm text-gray-500 mt-1 mb-3">
              {passedCount} of {totalExams} exams passed for {selectedCategory}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  progressPercent === 100 ? 'bg-green-500' : 'bg-amber-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {progressPercent === 100 && (
              <p className="text-sm text-green-700 mt-3 font-medium">
                All exams completed for {selectedCategory}.
              </p>
            )}
          </div>

        </div>

        <AdPlaceholder format="banner" className="my-6" />

        {/* Exam Progress - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* MCQ Column */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4">Multiple-Choice Question Exams</h2>
            <ProgressTracker
              examRows={mcqRows}
              selectedCategory={selectedCategory}
              userId={user.id}
              showAds
            />
          </div>

          {/* Essay Column */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4">Essay Exams</h2>
            {essayRows.length > 0 ? (
              <ProgressTracker
                examRows={essayRows}
                selectedCategory={selectedCategory}
                userId={user.id}
                showAds
              />
            ) : (
              <div className="bg-white/10 rounded-xl border border-white/20 p-6 text-center">
                <p className="text-white/50 text-sm">No essay exams required for {selectedCategory}.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

import { BtcToggle } from './btc-toggle'
