import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  PART_66_MODULES,
  MODULE_REQUIREMENTS,
  PROGRESS_CATEGORIES,
  getKnowledgeLevel,
  getCrossModuleEquivalency,
  isSameModuleEquivalent,
  EXPERIENCE_REQUIREMENTS,
} from '@/lib/progress/constants'
import type { ModuleExamProgress, ModuleProgressRow } from '@/lib/progress/types'
import { ProgressTracker } from './progress-tracker'

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

  // Get required modules for the selected category
  const requiredModuleIds = MODULE_REQUIREMENTS[selectedCategory] ?? []

  // Build module progress rows with equivalency detection
  const moduleRows: ModuleProgressRow[] = requiredModuleIds.map(moduleId => {
    const moduleDef = PART_66_MODULES.find(m => m.id === moduleId)!
    const level = getKnowledgeLevel(moduleId, selectedCategory)

    // Direct progress for this category
    let progress = progressRecords.find(
      p => p.module_id === moduleId && p.target_category === selectedCategory
    ) ?? null

    let equivalentFrom: ModuleProgressRow['equivalentFrom'] = null

    if (!progress) {
      // Check same-module equivalency from other categories
      // e.g., passed Module 1 at B1.1 level → counts for A1
      for (const record of progressRecords) {
        if (
          record.module_id === moduleId &&
          record.target_category !== selectedCategory &&
          record.mcq_score !== null &&
          record.mcq_score >= 75 &&
          isSameModuleEquivalent(record.target_category, selectedCategory, moduleId)
        ) {
          equivalentFrom = {
            sourceModule: moduleId,
            sourceCategory: record.target_category,
            description: `Passed at ${record.target_category} level (higher or equal)`,
          }
          break
        }
      }

      // Check cross-module equivalencies
      // e.g., B1 Module 15 → B2 Module 14
      if (!equivalentFrom) {
        const crossRule = getCrossModuleEquivalency(moduleId, selectedCategory)
        if (crossRule) {
          for (const record of progressRecords) {
            if (
              record.module_id === crossRule.sourceModule &&
              crossRule.sourceCategories.includes(record.target_category) &&
              record.mcq_score !== null &&
              record.mcq_score >= 75
            ) {
              equivalentFrom = {
                sourceModule: crossRule.sourceModule,
                sourceCategory: record.target_category,
                description: crossRule.description,
              }
              break
            }
          }
        }
      }
    }

    return {
      moduleId,
      title: moduleDef.title,
      knowledgeLevel: level,
      hasEssay: moduleDef.hasEssay,
      progress,
      equivalentFrom,
    }
  })

  // Calculate progress percentage
  const completedCount = moduleRows.filter(row => {
    if (row.equivalentFrom) return true
    if (!row.progress) return false
    const mcqPass = row.progress.mcq_score !== null && row.progress.mcq_score >= 75
    if (row.hasEssay) {
      const essayPass = row.progress.essay_score !== null && row.progress.essay_score >= 75
      return mcqPass && essayPass
    }
    return mcqPass
  }).length

  const totalRequired = moduleRows.length
  const progressPercent = totalRequired > 0 ? Math.round((completedCount / totalRequired) * 100) : 0

  // Experience requirement
  const expReq = EXPERIENCE_REQUIREMENTS[selectedCategory]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Module Exam Progress</h1>
            <p className="text-gray-500 mt-1">
              Track your Part-66 modular examination progress toward your licence.
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">← Dashboard</Button>
          </Link>
        </div>

        {/* Category Selector */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Target Licence Category
          </label>
          <div className="flex flex-wrap gap-2">
            {PROGRESS_CATEGORIES.map(cat => (
              <Link
                key={cat.value}
                href={`/progress?category=${cat.value}`}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  selectedCategory === cat.value
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {cat.value}
              </Link>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {PROGRESS_CATEGORIES.find(c => c.value === selectedCategory)?.label}
          </p>
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-3xl font-bold text-gray-900">{progressPercent}%</p>
              <p className="text-sm text-gray-500">
                {completedCount} of {totalRequired} modules completed for {selectedCategory}
              </p>
            </div>
            {expReq && (
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">Experience Required</p>
                <p className="text-xs text-gray-500">
                  {expReq.withBtc} years with Basic Training Course
                </p>
                <p className="text-xs text-gray-500">
                  {expReq.withoutBtc} years without
                </p>
              </div>
            )}
          </div>

          {/* Progress bar */}
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
              All modular exams completed for {selectedCategory}. You may be eligible to apply for your licence once experience requirements are met.
            </p>
          )}
        </div>

        {/* Module Progress Table */}
        <ProgressTracker
          moduleRows={moduleRows}
          selectedCategory={selectedCategory}
          userId={user.id}
        />

      </div>
    </div>
  )
}
