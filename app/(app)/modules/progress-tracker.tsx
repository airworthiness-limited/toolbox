'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  PASS_MARK,
  VERIFICATION_STATUSES,
} from '@/lib/progress/constants'
import type { ExamRow } from '@/lib/progress/types'
import { ShareMilestonePrompt } from '@/components/share-milestone-prompt'

interface ProgressTrackerProps {
  examRows: ExamRow[]
  selectedCategory: string
  userId: string
}

// MCQ form state
interface McqFormState {
  issue_date: string
  part_147_approval_number: string
  certificate_number: string
  score: string
}

// Essay form state
interface EssayFormState {
  issue_date: string
  part_147_approval_number: string
  certificate_number: string
  score: string
  essay_split: boolean
  score_2: string
}

function scoreColor(score: string): string {
  const num = parseInt(score, 10)
  if (isNaN(num) || score === '') return ''
  return num >= PASS_MARK ? 'bg-green-50 border-green-300 text-green-900 dark:bg-green-950 dark:border-green-700 dark:text-green-100' : 'bg-red-50 border-red-300 text-red-900 dark:bg-red-950 dark:border-red-700 dark:text-red-100'
}

function initMcqForm(row: ExamRow): McqFormState {
  const p = row.progress
  return {
    issue_date: p?.issue_date ?? '',
    part_147_approval_number: p?.part_147_approval_number ?? '',
    certificate_number: p?.certificate_number ?? '',
    score: p?.mcq_score !== null && p?.mcq_score !== undefined ? String(p.mcq_score) : '',
  }
}

function initEssayForm(row: ExamRow): EssayFormState {
  const p = row.progress
  return {
    issue_date: p?.issue_date ?? '',
    part_147_approval_number: p?.part_147_approval_number ?? '',
    certificate_number: p?.certificate_number ?? '',
    score: p?.essay_score !== null && p?.essay_score !== undefined ? String(p.essay_score) : '',
    essay_split: p?.essay_split ?? false,
    score_2: p?.essay_score_2 !== null && p?.essay_score_2 !== undefined ? String(p.essay_score_2) : '',
  }
}

export function ProgressTracker({ examRows, selectedCategory, userId }: ProgressTrackerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [mcqForms, setMcqForms] = useState<Record<string, McqFormState>>(() => {
    const init: Record<string, McqFormState> = {}
    for (const row of examRows) {
      if (row.examType === 'mcq') init[row.moduleId] = initMcqForm(row)
    }
    return init
  })

  const [essayForms, setEssayForms] = useState<Record<string, EssayFormState>>(() => {
    const init: Record<string, EssayFormState> = {}
    for (const row of examRows) {
      if (row.examType === 'essay') init[row.moduleId] = initEssayForm(row)
    }
    return init
  })

  // Re-initialize form state when category or exam data changes
  useEffect(() => {
    const mcqInit: Record<string, McqFormState> = {}
    const essayInit: Record<string, EssayFormState> = {}
    for (const row of examRows) {
      if (row.examType === 'mcq') mcqInit[row.moduleId] = initMcqForm(row)
      if (row.examType === 'essay') essayInit[row.moduleId] = initEssayForm(row)
    }
    setMcqForms(mcqInit)
    setEssayForms(essayInit)
  }, [selectedCategory, examRows])

  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [savedMsg, setSavedMsg] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  // Tracks which exam keys have just had a passing save and should show the share prompt
  const [sharePrompts, setSharePrompts] = useState<Record<string, { type: 'mcq' | 'essay'; score: number } | null>>({})

  function updateMcqField(moduleId: string, field: keyof McqFormState, value: string) {
    setMcqForms(prev => ({
      ...prev,
      [moduleId]: { ...prev[moduleId], [field]: value },
    }))
    setSavedMsg(prev => ({ ...prev, [`mcq-${moduleId}`]: '' }))
  }

  function updateEssayField(moduleId: string, field: keyof EssayFormState, value: string | boolean) {
    setEssayForms(prev => ({
      ...prev,
      [moduleId]: { ...prev[moduleId], [field]: value },
    }))
    setSavedMsg(prev => ({ ...prev, [`essay-${moduleId}`]: '' }))
  }

  async function handleSaveMcq(moduleId: string) {
    const key = `mcq-${moduleId}`
    setSaving(prev => ({ ...prev, [key]: true }))
    setSavedMsg(prev => ({ ...prev, [key]: '' }))

    const form = mcqForms[moduleId]
    const supabase = createClient()

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
          mcq_score: form.score ? parseInt(form.score, 10) : null,
        },
        { onConflict: 'user_id,target_category,module_id' }
      )

    setSaving(prev => ({ ...prev, [key]: false }))
    if (error) {
      setSavedMsg(prev => ({ ...prev, [key]: 'Failed to save' }))
    } else {
      setSavedMsg(prev => ({ ...prev, [key]: 'Saved' }))
      // Show share prompt if the score is a pass
      const score = form.score ? parseInt(form.score, 10) : NaN
      if (!isNaN(score) && score >= PASS_MARK) {
        setSharePrompts(prev => ({ ...prev, [key]: { type: 'mcq', score } }))
      }
      startTransition(() => router.refresh())
    }
  }

  async function handleSaveEssay(moduleId: string) {
    const key = `essay-${moduleId}`
    setSaving(prev => ({ ...prev, [key]: true }))
    setSavedMsg(prev => ({ ...prev, [key]: '' }))

    const form = essayForms[moduleId]
    const supabase = createClient()

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
          essay_score: form.score ? parseInt(form.score, 10) : null,
          essay_split: form.essay_split,
          essay_score_2: form.essay_split && form.score_2 ? parseInt(form.score_2, 10) : null,
        },
        { onConflict: 'user_id,target_category,module_id' }
      )

    setSaving(prev => ({ ...prev, [key]: false }))
    if (error) {
      setSavedMsg(prev => ({ ...prev, [key]: 'Failed to save' }))
    } else {
      setSavedMsg(prev => ({ ...prev, [key]: 'Saved' }))
      // Show share prompt if the essay is a pass (and the second part too if split)
      const score = form.score ? parseInt(form.score, 10) : NaN
      const score2 = form.essay_split && form.score_2 ? parseInt(form.score_2, 10) : NaN
      const passed = !isNaN(score) && score >= PASS_MARK && (!form.essay_split || (!isNaN(score2) && score2 >= PASS_MARK))
      if (passed) {
        setSharePrompts(prev => ({ ...prev, [key]: { type: 'essay', score } }))
      }
      startTransition(() => router.refresh())
    }
  }

  async function handleRemove(moduleId: string) {
    const confirmed = window.confirm(
      'Are you sure you want to remove this entry? This will clear all data and any verification status for this exam.'
    )
    if (!confirmed) return

    const supabase = createClient()
    await supabase
      .from('module_exam_progress')
      .delete()
      .eq('user_id', userId)
      .eq('target_category', selectedCategory)
      .eq('module_id', moduleId)

    // Reset local form state
    setMcqForms(prev => ({
      ...prev,
      [moduleId]: { issue_date: '', part_147_approval_number: '', certificate_number: '', score: '' },
    }))
    setEssayForms(prev => ({
      ...prev,
      [moduleId]: { issue_date: '', part_147_approval_number: '', certificate_number: '', score: '', essay_split: false, score_2: '' },
    }))
    setSavedMsg(prev => ({ ...prev, [`mcq-${moduleId}`]: '', [`essay-${moduleId}`]: '' }))
    startTransition(() => router.refresh())
  }

  async function handleRemoveEquivalent(row: ExamRow) {
    if (!row.equivalentFrom) return
    const confirmed = window.confirm(
      `Are you sure you want to remove this entry? This will delete the source record from ${row.equivalentFrom.sourceCategory} (Module ${row.equivalentFrom.sourceModule}).`
    )
    if (!confirmed) return

    const supabase = createClient()
    await supabase
      .from('module_exam_progress')
      .delete()
      .eq('user_id', userId)
      .eq('target_category', row.equivalentFrom.sourceCategory)
      .eq('module_id', row.equivalentFrom.sourceModule)

    startTransition(() => router.refresh())
  }

  async function handleUpload(moduleId: string, file: File) {
    const key = `upload-${moduleId}`
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
      setSavedMsg(prev => ({ ...prev, [key]: 'Certificate uploaded' }))
      startTransition(() => router.refresh())
    } else {
      setSavedMsg(prev => ({ ...prev, [key]: 'Upload failed' }))
    }
  }

  return (
    <div className="space-y-4">
      {examRows.map((row, index) => {
        const isEquivalent = !!row.equivalentFrom
        const isMcq = row.examType === 'mcq'
        const isEssay = row.examType === 'essay'
        const cardKey = `${row.examType}-${row.moduleId}`
        const verificationStatus = row.progress?.verification_status
        const statusInfo = verificationStatus
          ? VERIFICATION_STATUSES[verificationStatus]
          : null

        // Determine if this specific exam is passed
        let examPassed = false
        if (isEquivalent) {
          examPassed = true
        } else if (row.progress) {
          if (isMcq) {
            examPassed = row.progress.mcq_score !== null && row.progress.mcq_score >= PASS_MARK
          } else {
            const e1 = row.progress.essay_score !== null && row.progress.essay_score >= PASS_MARK
            if (row.progress.essay_split) {
              const e2 = row.progress.essay_score_2 !== null && row.progress.essay_score_2 >= PASS_MARK
              examPassed = e1 && e2
            } else {
              examPassed = e1
            }
          }
        }

        // Expired entries override passed status
        if (row.isExpired) examPassed = false

        // Verification: treat legacy 'pending'/'rejected' as 'unverified'
        const displayVerification = verificationStatus === 'verified' ? 'verified' : 'unverified'
        const statusInfo2 = VERIFICATION_STATUSES[displayVerification]

        return (
          <React.Fragment key={cardKey}>
          <Card
            className={`${
              row.isExpired
                ? 'border-red-200 bg-red-50/30 dark:border-red-800 dark:bg-red-950/30'
                : examPassed
                  ? 'border-green-200 bg-green-50/30 dark:border-green-800 dark:bg-green-950/30'
                  : isEquivalent
                    ? 'border-border bg-muted/30 dark:border-border dark:bg-muted/30'
                    : ''
            }`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base whitespace-nowrap overflow-hidden text-ellipsis">
                Module {row.moduleId}: {row.title}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {row.isExpired && (
                  <Badge variant="destructive">Expired</Badge>
                )}
                {examPassed && !row.isExpired && (
                  <Badge variant="default" className="bg-green-600">Passed</Badge>
                )}
                {isEquivalent && !row.isExpired && (
                  <Badge variant="secondary" className="bg-muted text-foreground border-border">
                    Equivalent
                  </Badge>
                )}
                {row.progress && isMcq && (
                  <Badge variant={statusInfo2.color as 'outline' | 'default'}>
                    {statusInfo2.label}
                  </Badge>
                )}
              </div>
              {isEquivalent && row.equivalentFrom && (
                <p className={`text-xs mt-1 ${row.isExpired ? 'text-red-600' : 'text-foreground'}`}>
                  {row.equivalentFrom.description}
                </p>
              )}
              {row.isExpired && row.progress?.issue_date && (
                <p className="text-xs text-red-600 mt-1">
                  This exam result expired on {new Date(new Date(row.progress.issue_date).setFullYear(new Date(row.progress.issue_date).getFullYear() + 10)).toLocaleDateString('en-GB')}
                </p>
              )}
            </CardHeader>

            {isEquivalent && (
              <CardContent>
                <div className="flex items-center pt-1">
                  <div className="ml-auto">
                    <button
                      type="button"
                      onClick={() => handleRemoveEquivalent(row)}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </CardContent>
            )}

            {!isEquivalent && isMcq && (
              <>
                <McqCardContent
                  row={row}
                  form={mcqForms[row.moduleId] ?? initMcqForm(row)}
                  saving={saving[`mcq-${row.moduleId}`] ?? false}
                  savedMsg={savedMsg[`mcq-${row.moduleId}`] ?? ''}
                  uploadMsg={savedMsg[`upload-${row.moduleId}`] ?? ''}
                  uploading={uploading[row.moduleId] ?? false}
                  onFieldChange={updateMcqField}
                  onSave={handleSaveMcq}
                  onUpload={handleUpload}
                  onRemove={handleRemove}
                />
                {sharePrompts[`mcq-${row.moduleId}`] && (
                  <div className="px-6 pb-4">
                    <ShareMilestonePrompt
                      postType="module_pass"
                      data={{
                        module_id: row.moduleId,
                        category: selectedCategory,
                        mcq_score: sharePrompts[`mcq-${row.moduleId}`]!.score,
                      }}
                      preview={`Passed Module ${row.moduleId} (${selectedCategory}) — MCQ ${sharePrompts[`mcq-${row.moduleId}`]!.score}%`}
                      onDone={() => setSharePrompts(prev => ({ ...prev, [`mcq-${row.moduleId}`]: null }))}
                    />
                  </div>
                )}
              </>
            )}

            {!isEquivalent && isEssay && (
              <>
                <EssayCardContent
                  row={row}
                  form={essayForms[row.moduleId] ?? initEssayForm(row)}
                  saving={saving[`essay-${row.moduleId}`] ?? false}
                  savedMsg={savedMsg[`essay-${row.moduleId}`] ?? ''}
                  onFieldChange={updateEssayField}
                  onSave={handleSaveEssay}
                  onRemove={handleRemove}
                />
                {sharePrompts[`essay-${row.moduleId}`] && (
                  <div className="px-6 pb-4">
                    <ShareMilestonePrompt
                      postType="module_pass"
                      data={{
                        module_id: row.moduleId,
                        category: selectedCategory,
                        essay_score: sharePrompts[`essay-${row.moduleId}`]!.score,
                      }}
                      preview={`Passed Module ${row.moduleId} (${selectedCategory}) — Essay ${sharePrompts[`essay-${row.moduleId}`]!.score}%`}
                      onDone={() => setSharePrompts(prev => ({ ...prev, [`essay-${row.moduleId}`]: null }))}
                    />
                  </div>
                )}
              </>
            )}
          </Card>
        </React.Fragment>
        )
      })}
    </div>
  )
}

function McqCardContent({
  row,
  form,
  saving,
  savedMsg,
  uploadMsg,
  uploading,
  onFieldChange,
  onSave,
  onUpload,
  onRemove,
}: {
  row: ExamRow
  form: McqFormState
  saving: boolean
  savedMsg: string
  uploadMsg: string
  uploading: boolean
  onFieldChange: (moduleId: string, field: keyof McqFormState, value: string) => void
  onSave: (moduleId: string) => void
  onUpload: (moduleId: string, file: File) => void
  onRemove: (moduleId: string) => void
}) {
  return (
    <CardContent>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Part 147 Approval Reference
          </label>
          <Input
            type="text"
            value={form.part_147_approval_number}
            onChange={e => onFieldChange(row.moduleId, 'part_147_approval_number', e.target.value)}
            placeholder="e.g. UK.147.0000"
            className="text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Certificate Reference
          </label>
          <Input
            type="text"
            value={form.certificate_number}
            onChange={e => onFieldChange(row.moduleId, 'certificate_number', e.target.value)}
            placeholder="e.g. UK.147.0000.001"
            className="text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Issue Date
          </label>
          <Input
            type="date"
            value={form.issue_date}
            onChange={e => onFieldChange(row.moduleId, 'issue_date', e.target.value)}
            className="text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Mark (%)
          </label>
          <Input
            type="number"
            min={0}
            max={100}
            value={form.score}
            onChange={e => onFieldChange(row.moduleId, 'score', e.target.value)}
            placeholder="0-100"
            className={`text-sm ${scoreColor(form.score)}`}
          />
        </div>
      </div>

      {/* Certificate Upload & Save */}
      <div className="flex items-center gap-3 mt-4 pt-3 border-t">
        <Button
          size="sm"
          onClick={() => onSave(row.moduleId)}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>

        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) onUpload(row.moduleId, file)
            }}
          />
          <span className="inline-flex items-center px-3 py-1.5 rounded-md border text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
            {uploading
              ? 'Uploading...'
              : row.progress?.certificate_photo_path
                ? 'Replace Certificate'
                : 'Upload Certificate'}
          </span>
        </label>

        {row.progress?.certificate_photo_path && (
          <span className="text-xs text-green-600">Certificate on file</span>
        )}

        {savedMsg && (
          <span className={`text-xs font-medium ${
            savedMsg === 'Saved' ? 'text-green-600' : 'text-red-600'
          }`}>
            {savedMsg}
          </span>
        )}
        {uploadMsg && (
          <span className={`text-xs font-medium ${
            uploadMsg === 'Certificate uploaded' ? 'text-green-600' : 'text-red-600'
          }`}>
            {uploadMsg}
          </span>
        )}

        <div className="ml-auto">
          <button
            type="button"
            onClick={() => onRemove(row.moduleId)}
            className="text-xs text-red-500 hover:text-red-700 transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </CardContent>
  )
}

function EssayCardContent({
  row,
  form,
  saving,
  savedMsg,
  onFieldChange,
  onSave,
  onRemove,
}: {
  row: ExamRow
  form: EssayFormState
  saving: boolean
  savedMsg: string
  onFieldChange: (moduleId: string, field: keyof EssayFormState, value: string | boolean) => void
  onSave: (moduleId: string) => void
  onRemove: (moduleId: string) => void
}) {
  return (
    <CardContent>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Part 147 Approval Reference
            </label>
            <Input
              type="text"
              value={form.part_147_approval_number}
              onChange={e => onFieldChange(row.moduleId, 'part_147_approval_number', e.target.value)}
              placeholder="e.g. UK.147.0000"
              className="text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Certificate Reference
            </label>
            <Input
              type="text"
              value={form.certificate_number}
              onChange={e => onFieldChange(row.moduleId, 'certificate_number', e.target.value)}
              placeholder="e.g. UK.147.0000.001"
              className="text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Issue Date
            </label>
            <Input
              type="date"
              value={form.issue_date}
              onChange={e => onFieldChange(row.moduleId, 'issue_date', e.target.value)}
              className="text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {form.essay_split ? 'Mark 1 (%)' : 'Mark (%)'}
            </label>
            <Input
              type="number"
              min={0}
              max={100}
              value={form.score}
              onChange={e => onFieldChange(row.moduleId, 'score', e.target.value)}
              placeholder="0-100"
              className={`text-sm ${scoreColor(form.score)}`}
            />
          </div>
        </div>

        {/* Split essay toggle */}
        {row.canSplitEssay && (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.essay_split}
              onChange={e => onFieldChange(row.moduleId, 'essay_split', e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <span className="text-xs text-muted-foreground">
              Split Essay Marks
            </span>
          </label>
        )}

        {form.essay_split && (
          <div className="grid grid-cols-2 gap-4">
            <div />
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Mark 2 (%)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.score_2}
                onChange={e => onFieldChange(row.moduleId, 'score_2', e.target.value)}
                placeholder="0-100"
                className={`text-sm ${scoreColor(form.score_2)}`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex items-center gap-3 mt-4 pt-3 border-t">
        <Button
          size="sm"
          onClick={() => onSave(row.moduleId)}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>

        {savedMsg && (
          <span className={`text-xs font-medium ${
            savedMsg === 'Saved' ? 'text-green-600' : 'text-red-600'
          }`}>
            {savedMsg}
          </span>
        )}

        <div className="ml-auto">
          <button
            type="button"
            onClick={() => onRemove(row.moduleId)}
            className="text-xs text-red-500 hover:text-red-700 transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </CardContent>
  )
}
