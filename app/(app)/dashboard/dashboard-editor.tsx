'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Pencil, ArrowUp, ArrowDown, Eye, EyeOff, Check } from 'lucide-react'
import { ExternalTrainingForm } from './external-training-form'
import type { TrainingStatus } from '@/lib/profile/types'

const ALL_WIDGET_IDS = ['module_exams', 'logbook_tasks', 'recency', 'continuation_training'] as const
type WidgetId = typeof ALL_WIDGET_IDS[number]

const WIDGET_LABELS: Record<WidgetId, string> = {
  module_exams: 'Module Exams',
  logbook_tasks: 'Logbook Tasks',
  recency: 'Recency',
  continuation_training: 'Continuation Training',
}

interface WidgetConfig {
  order: WidgetId[]
  hidden: WidgetId[]
}

interface DashboardEditorProps {
  fullName: string
  selectedCategory: string
  passedModules: number
  totalModules: number
  progressPercent: number
  logbookCount: number
  recencyTotalDays: number
  recencyRequiredDays: number
  recencyIsCurrent: boolean
  trainingStatuses: TrainingStatus[]
  allTrainingCurrent: boolean
  externalCerts: { training_slug: string; completion_date: string | null; expiry_date: string | null; certificate_path: string | null }[]
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

  function renderWidget(id: WidgetId) {
    switch (id) {
      case 'module_exams':
        return (
          <div key={id} className="rounded-xl border border-border p-6">
            <p className="text-sm text-muted-foreground">Module Exams ({props.selectedCategory})</p>
            <p className="text-3xl font-bold mt-1">{props.passedModules}/{props.totalModules}</p>
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
          <div key={id} className="rounded-xl border border-border p-6">
            <p className="text-sm text-muted-foreground">Logbook Tasks</p>
            <p className="text-3xl font-bold mt-1">{props.logbookCount}</p>
          </div>
        )
      case 'recency':
        return (
          <div key={id} className="rounded-xl border border-border p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Recency (6 Months / 2 Years)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tasks</span>
                  <span className="text-sm font-semibold text-foreground">{props.logbookCount} / 180</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                  <div
                    style={{ width: `${Math.min(100, (props.logbookCount / 180) * 100)}%`, backgroundColor: props.logbookCount >= 180 ? '#22c55e' : '#3b82f6' }}
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
          <Card key={id}>
            <CardHeader>
              <CardTitle>Continuation Training</CardTitle>
              <CardDescription>Required to be completed within the last 2 years.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {props.trainingStatuses.map(training => {
                  const extCert = props.externalCerts?.find(c => c.training_slug === training.slug)
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
              {!props.allTrainingCurrent && (
                <div className="mt-4">
                  <Link href="/training">
                    <Button size="sm">Complete Training</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )
    }
  }

  // Stats widgets render in a grid, others render full-width
  const statsWidgets = visibleWidgets.filter(id => id === 'module_exams' || id === 'logbook_tasks')
  const otherWidgets = visibleWidgets.filter(id => id !== 'module_exams' && id !== 'logbook_tasks')

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
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

      {/* Widgets */}
      {statsWidgets.length > 0 && (
        <div className={`grid gap-4 mb-4 ${statsWidgets.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {statsWidgets.map(id => renderWidget(id))}
        </div>
      )}

      <div className="space-y-4">
        {otherWidgets.map(id => renderWidget(id))}
      </div>
    </div>
  )
}
