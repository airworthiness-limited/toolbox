'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ESSAY_MODULES,
  PASS_MARK,
  VERIFICATION_STATUSES,
} from '@/lib/progress/constants'
import type { ModuleProgressRow } from '@/lib/progress/types'

interface ProgressTrackerProps {
  moduleRows: ModuleProgressRow[]
  selectedCategory: string
  userId: string
}

interface ModuleFormState {
  issue_date: string
  part_147_approval_number: string
  certificate_number: string
  mcq_score: string
  essay_score: string
  is_btc: boolean
}

function getInitialFormState(row: ModuleProgressRow): ModuleFormState {
  const p = row.progress
  return {
    issue_date: p?.issue_date ?? '',
    part_147_approval_number: p?.part_147_approval_number ?? '',
    certificate_number: p?.certificate_number ?? '',
    mcq_score: p?.mcq_score !== null && p?.mcq_score !== undefined ? String(p.mcq_score) : '',
    essay_score: p?.essay_score !== null && p?.essay_score !== undefined ? String(p.essay_score) : '',
    is_btc: p?.is_btc ?? false,
  }
}

function scoreColor(score: string): string {
  const num = parseInt(score, 10)
  if (isNaN(num) || score === '') return ''
  return num >= PASS_MARK ? 'bg-green-50 border-green-300 text-green-900' : 'bg-red-50 border-red-300 text-red-900'
}

export function ProgressTracker({ moduleRows, selectedCategory, userId }: ProgressTrackerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Form state per module
  const [forms, setForms] = useState<Record<string, ModuleFormState>>(() => {
    const initial: Record<string, ModuleFormState> = {}
    for (const row of moduleRows) {
      initial[row.moduleId] = getInitialFormState(row)
    }
    return initial
  })

  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [savedMsg, setSavedMsg] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState<Record<string, boolean>>({})

  function updateField(moduleId: string, field: keyof ModuleFormState, value: string | boolean) {
    setForms(prev => ({
      ...prev,
      [moduleId]: { ...prev[moduleId], [field]: value },
    }))
    setSavedMsg(prev => ({ ...prev, [moduleId]: '' }))
  }

  async function handleSave(moduleId: string) {
    setSaving(prev => ({ ...prev, [moduleId]: true }))
    setSavedMsg(prev => ({ ...prev, [moduleId]: '' }))

    const form = forms[moduleId]
    const supabase = createClient()

    const mcqScore = form.mcq_score ? parseInt(form.mcq_score, 10) : null
    const essayScore = form.essay_score ? parseInt(form.essay_score, 10) : null

    const { error } = await supabase
      .from('module_exam_progress')
      .upsert(
        {
          user_id: userId,
          target_category: selectedCategory,
          module_id: moduleId,
          issue_date: form.issue_date || null,
          part_147_approval_number: form.part_147_approval_number || null,
          certificate_number: form.certificate_number || null,
          mcq_score: mcqScore,
          essay_score: essayScore,
          is_btc: form.is_btc,
        },
        { onConflict: 'user_id,target_category,module_id' }
      )

    setSaving(prev => ({ ...prev, [moduleId]: false }))

    if (error) {
      setSavedMsg(prev => ({ ...prev, [moduleId]: 'Failed to save' }))
    } else {
      setSavedMsg(prev => ({ ...prev, [moduleId]: 'Saved' }))
      startTransition(() => router.refresh())
    }
  }

  async function handleUpload(moduleId: string, file: File) {
    setUploading(prev => ({ ...prev, [moduleId]: true }))

    const formData = new FormData()
    formData.append('file', file)
    formData.append('module_id', moduleId)
    formData.append('target_category', selectedCategory)

    const res = await fetch('/api/progress/upload', {
      method: 'POST',
      body: formData,
    })

    setUploading(prev => ({ ...prev, [moduleId]: false }))

    if (res.ok) {
      setSavedMsg(prev => ({ ...prev, [moduleId]: 'Certificate uploaded' }))
      startTransition(() => router.refresh())
    } else {
      setSavedMsg(prev => ({ ...prev, [moduleId]: 'Upload failed' }))
    }
  }

  return (
    <div className="space-y-4">
      {moduleRows.map(row => {
        const form = forms[row.moduleId]
        const isEquivalent = !!row.equivalentFrom
        const hasEssay = ESSAY_MODULES.includes(row.moduleId)
        const verificationStatus = row.progress?.verification_status
        const statusInfo = verificationStatus
          ? VERIFICATION_STATUSES[verificationStatus]
          : null

        // Determine if module is passed
        const mcqNum = form.mcq_score ? parseInt(form.mcq_score, 10) : null
        const essayNum = form.essay_score ? parseInt(form.essay_score, 10) : null
        const mcqPassed = mcqNum !== null && mcqNum >= PASS_MARK
        const essayPassed = !hasEssay || (essayNum !== null && essayNum >= PASS_MARK)
        const modulePassed = isEquivalent || (mcqPassed && essayPassed)

        return (
          <Card
            key={row.moduleId}
            className={`${
              modulePassed
                ? 'border-green-200 bg-green-50/30'
                : isEquivalent
                  ? 'border-blue-200 bg-blue-50/30'
                  : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base">
                    Module {row.moduleId} — {row.title}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    Level {row.knowledgeLevel}
                  </Badge>
                  {hasEssay && (
                    <Badge variant="outline" className="text-xs">
                      MCQ + Essay
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {modulePassed && (
                    <Badge variant="default" className="bg-green-600">Passed</Badge>
                  )}
                  {isEquivalent && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                      Equivalent
                    </Badge>
                  )}
                  {statusInfo && row.progress && (
                    <Badge variant={statusInfo.color as 'outline' | 'default' | 'destructive'}>
                      {statusInfo.label}
                    </Badge>
                  )}
                </div>
              </div>
              {isEquivalent && row.equivalentFrom && (
                <p className="text-xs text-blue-600 mt-1">
                  {row.equivalentFrom.description}
                </p>
              )}
              {verificationStatus === 'rejected' && row.progress?.rejection_reason && (
                <p className="text-xs text-red-600 mt-1">
                  Rejection reason: {row.progress.rejection_reason}
                </p>
              )}
            </CardHeader>

            {!isEquivalent && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Issue Date */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Issue Date
                    </label>
                    <Input
                      type="date"
                      value={form.issue_date}
                      onChange={e => updateField(row.moduleId, 'issue_date', e.target.value)}
                      className="text-sm"
                    />
                  </div>

                  {/* Part 147 Approval Number */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Part 147 Approval No.
                    </label>
                    <Input
                      type="text"
                      value={form.part_147_approval_number}
                      onChange={e => updateField(row.moduleId, 'part_147_approval_number', e.target.value)}
                      placeholder="e.g. UK.147.0001"
                      className="text-sm"
                    />
                  </div>

                  {/* Certificate Number */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Certificate Number
                    </label>
                    <Input
                      type="text"
                      value={form.certificate_number}
                      onChange={e => updateField(row.moduleId, 'certificate_number', e.target.value)}
                      placeholder="Certificate ref"
                      className="text-sm"
                    />
                  </div>

                  {/* MCQ Score */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      MCQ Score (%)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={form.mcq_score}
                      onChange={e => updateField(row.moduleId, 'mcq_score', e.target.value)}
                      placeholder="0–100"
                      className={`text-sm ${scoreColor(form.mcq_score)}`}
                    />
                  </div>

                  {/* Essay Score (only for essay modules) */}
                  {hasEssay && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Essay Score (%)
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={form.essay_score}
                        onChange={e => updateField(row.moduleId, 'essay_score', e.target.value)}
                        placeholder="0–100"
                        className={`text-sm ${scoreColor(form.essay_score)}`}
                      />
                    </div>
                  )}

                  {/* BTC Toggle */}
                  <div className="flex items-center gap-2 self-end pb-2">
                    <input
                      type="checkbox"
                      id={`btc-${row.moduleId}`}
                      checked={form.is_btc}
                      onChange={e => updateField(row.moduleId, 'is_btc', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor={`btc-${row.moduleId}`} className="text-xs text-gray-600">
                      Basic Training Course
                    </label>
                  </div>
                </div>

                {/* Certificate Upload & Save */}
                <div className="flex items-center gap-3 mt-4 pt-3 border-t">
                  <Button
                    size="sm"
                    onClick={() => handleSave(row.moduleId)}
                    disabled={saving[row.moduleId]}
                  >
                    {saving[row.moduleId] ? 'Saving...' : 'Save'}
                  </Button>

                  {/* File upload */}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) handleUpload(row.moduleId, file)
                      }}
                    />
                    <span className="inline-flex items-center px-3 py-1.5 rounded-md border text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                      {uploading[row.moduleId]
                        ? 'Uploading...'
                        : row.progress?.certificate_photo_path
                          ? 'Replace Certificate'
                          : 'Upload Certificate'}
                    </span>
                  </label>

                  {row.progress?.certificate_photo_path && (
                    <span className="text-xs text-green-600">Certificate on file</span>
                  )}

                  {/* Save feedback */}
                  {savedMsg[row.moduleId] && (
                    <span className={`text-xs font-medium ${
                      savedMsg[row.moduleId] === 'Saved' || savedMsg[row.moduleId] === 'Certificate uploaded'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {savedMsg[row.moduleId]}
                    </span>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
