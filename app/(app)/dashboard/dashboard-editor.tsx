'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, ArrowUp, ArrowDown, Eye, EyeOff, Check } from 'lucide-react'
import { ExternalTrainingForm } from './external-training-form'
import { SidebarTriggerInline } from '@/components/sidebar-trigger-inline'
import type { TrainingStatus } from '@/lib/profile/types'

const ALL_WIDGET_IDS = ['module_exams', 'logbook_tasks', 'recency', 'recent_entries', 'continuation_training'] as const
type WidgetId = typeof ALL_WIDGET_IDS[number]

const WIDGET_LABELS: Record<WidgetId, string> = {
  module_exams: 'Module Exams',
  logbook_tasks: 'Logbook Tasks',
  recency: 'Recency',
  recent_entries: 'Most Recent Logbook Tasks',
  continuation_training: 'Continuation Training',
}

interface WidgetConfig {
  order: WidgetId[]
  hidden: WidgetId[]
}

interface DashboardEditorProps {
  fullName: string
  selectedCategory: string
  passedExams: number
  totalExams: number
  progressPercent: number
  logbookCount: number
  recencyTotalTasks: number
  recencyTaskThreshold: number
  recencyTotalDays: number
  recencyRequiredDays: number
  recencyIsCurrent: boolean
  trainingStatuses: TrainingStatus[]
  allTrainingCurrent: boolean
  externalCerts: { training_slug: string; completion_date: string | null; expiry_date: string | null; certificate_path: string | null }[]
  recentEntries: { id: string; task_date: string; aircraft_type: string; aircraft_registration: string; description: string; status: string }[]
  widgetConfig: WidgetConfig | null
}

function getConfig(saved: WidgetConfig | null): WidgetConfig {
  if (saved && saved.order && saved.hidden) return saved
  return { order: [...ALL_WIDGET_IDS], hidden: [] }
}

export function DashboardEditor(props: DashboardEditorProps) {
  const [editing, setEditing] = useState(false)
  const [config, setConfig] = useState<WidgetConfig>(() => getConfig(props.widgetConfig))
  const [saving, setSaving] = useState(false)

  function moveWidget(id: WidgetId, direction: 'up' | 'down') {
    setConfig(prev => {
      const order = [...prev.order]
      const idx = order.indexOf(id)
      if (direction === 'up' && idx > 0) {
        [order[idx - 1], order[idx]] = [order[idx], order[idx - 1]]
      } else if (direction === 'down' && idx < order.length - 1) {
        [order[idx], order[idx + 1]] = [order[idx + 1], order[idx]]
      }
      return { ...prev, order }
    })
  }

  function toggleWidget(id: WidgetId) {
    setConfig(prev => {
      const hidden = prev.hidden.includes(id)
        ? prev.hidden.filter(h => h !== id)
        : [...prev.hidden, id]
      return { ...prev, hidden }
    })
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ dashboard_widgets: config })
        .eq('id', user.id)
    }
    setSaving(false)
    setEditing(false)
  }

  const visibleWidgets = config.order.filter(id => !config.hidden.includes(id))

  const WIDGET_CARD = 'rounded-xl border border-border p-5 overflow-hidden'

  function renderWidget(id: WidgetId) {
    switch (id) {
      case 'module_exams':
        return (
          <div key={id} className={WIDGET_CARD}>
            <p className="text-sm text-muted-foreground">Module Exams ({props.selectedCategory})</p>
            <p className="text-3xl font-bold mt-1">{props.passedExams}/{props.totalExams}</p>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all ${props.progressPercent === 100 ? 'bg-green-500' : 'bg-amber-500'}`}
                style={{ width: `${props.progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{props.progressPercent}% complete</p>
          </div>
        )
      case 'logbook_tasks':
        return (
          <div key={id} className={WIDGET_CARD}>
            <p className="text-sm text-muted-foreground">Logbook Tasks</p>
            <p className="text-3xl font-bold mt-1">{props.logbookCount}</p>
          </div>
        )
      case 'recency':
        return (
          <div key={id} className={WIDGET_CARD}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Recency (6 Months / 2 Years)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tasks</span>
                  <span className="text-sm font-semibold text-foreground">{props.recencyTotalTasks} / {props.recencyTaskThreshold}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                  <div
                    style={{ width: `${Math.min(100, (props.recencyTotalTasks / props.recencyTaskThreshold) * 100)}%`, backgroundColor: props.recencyTotalTasks >= props.recencyTaskThreshold ? '#22c55e' : '#3b82f6' }}
                    className="h-1.5 rounded-full"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Days</span>
                  <span className="text-sm font-semibold text-foreground">{props.recencyTotalDays} / {props.recencyRequiredDays}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                  <div
                    style={{ width: `${Math.min(100, (props.recencyTotalDays / props.recencyRequiredDays) * 100)}%`, backgroundColor: props.recencyIsCurrent ? '#22c55e' : '#3b82f6' }}
                    className="h-1.5 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>
        )
      case 'continuation_training':
        return (
          <div key={id} className={`${WIDGET_CARD} md:col-span-2`}>
            <p className="text-base font-semibold text-foreground">Continuation Training</p>
            <p className="text-sm text-muted-foreground mb-3">Required to be completed within the last 2 years.</p>
            <div className="grid gap-3 min-w-0">
              {props.trainingStatuses.map(training => {
                const extCert = props.externalCerts?.find(c => c.training_slug === training.slug)
                return (
                  <div key={training.slug} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{training.label}</p>
                        {training.certificateDate ? (
                          <p className="text-xs text-muted-foreground mt-0.5">
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
                          <p className="text-xs text-muted-foreground mt-0.5">No certificate on record</p>
                        )}
                      </div>
                      <Badge className="shrink-0" variant={training.isCurrent ? 'default' : 'destructive'}>
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
            {!props.allTrainingCurrent && (
              <div className="mt-4">
                <Link href="/training">
                  <Button size="sm">Complete Training</Button>
                </Link>
              </div>
            )}
          </div>
        )
      case 'recent_entries':
        return (
          <div key={id} className={WIDGET_CARD}>
            <p className="text-base font-semibold text-foreground mb-3">Most Recent Logbook Tasks</p>
            {props.recentEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No logbook tasks recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {props.recentEntries.map(entry => {
                  const taskTypeMatch = entry.description?.match(/^\[([^\]]+)\]/)
                  const taskTypes = taskTypeMatch ? taskTypeMatch[1] : null
                  const detail = entry.description?.replace(/^\[[^\]]+\]\s*/, '') || ''
                  const statusLabel = entry.status === 'verified' ? 'Verified' : entry.status === 'draft' ? 'Draft' : entry.status === 'pending_verification' ? 'Pending' : entry.status
                  return (
                    <div key={entry.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                      <div className="text-xs text-muted-foreground whitespace-nowrap pt-0.5">
                        {new Date(entry.task_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{detail || entry.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {entry.aircraft_type !== 'N/A' && entry.aircraft_type}
                          {entry.aircraft_type !== 'N/A' && entry.aircraft_registration !== 'N/A' && ' · '}
                          {entry.aircraft_registration !== 'N/A' && entry.aircraft_registration}
                          {taskTypes && ` · ${taskTypes}`}
                        </p>
                      </div>
                      <Badge variant={entry.status === 'verified' ? 'default' : 'outline'} className="text-[10px] flex-shrink-0">
                        {statusLabel}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
            {props.recentEntries.length > 0 && (
              <div className="mt-3">
                <Link href="/logbook">
                  <Button variant="outline" size="sm">View All Tasks</Button>
                </Link>
              </div>
            )}
          </div>
        )
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center gap-2">
        <SidebarTriggerInline />
        <h1 className="text-2xl font-semibold text-foreground">
          Dashboard
        </h1>
        <button
          onClick={() => editing ? handleSave() : setEditing(true)}
          disabled={saving}
          className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
          title={editing ? 'Save' : 'Customise'}
        >
          {editing ? (
            <Check className="w-4 h-4" strokeWidth={2} />
          ) : (
            <Pencil className="w-4 h-4" strokeWidth={1.5} />
          )}
        </button>
      </div>

      {/* Edit mode panel */}
      {editing && (
        <div className="mb-6 rounded-xl border border-border p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Customise</p>
          <div className="space-y-2">
            {config.order.map((id, idx) => {
              const isHidden = config.hidden.includes(id)
              return (
                <div key={id} className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${isHidden ? 'opacity-40' : ''}`}>
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveWidget(id, 'up')}
                      disabled={idx === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-20 p-0.5"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveWidget(id, 'down')}
                      disabled={idx === config.order.length - 1}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-20 p-0.5"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-sm font-medium text-foreground flex-1">{WIDGET_LABELS[id]}</span>
                  <button
                    onClick={() => toggleWidget(id)}
                    className="text-muted-foreground hover:text-foreground p-0.5"
                    title={isHidden ? 'Show' : 'Hide'}
                  >
                    {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              )
            })}
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setConfig(getConfig(props.widgetConfig)); setEditing(false) }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Widgets — responsive grid: 1 col mobile, 2 col desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleWidgets.map(id => renderWidget(id))}
      </div>
    </div>
  )
}
