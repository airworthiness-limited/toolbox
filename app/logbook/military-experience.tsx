'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  EXPERIENCE_REQUIREMENTS,
  MIN_CIVIL_MONTHS,
} from '@/lib/logbook/constants'

interface MilitaryExperienceProps {
  selectedCategory: string
  hasMilitaryPeriod: boolean
  militaryStart: string
  militaryEnd: string | null
  civilMonths: number
  militaryMonths: number
  totalExpMonths: number
}

function formatDuration(months: number): string {
  const y = Math.floor(months / 12)
  const m = months % 12
  const parts: string[] = []
  if (y > 0) parts.push(`${y} YEAR${y > 1 ? 'S' : ''}`)
  if (m > 0) parts.push(`${m} MONTH${m > 1 ? 'S' : ''}`)
  return parts.join(' AND ') || '0 MONTHS'
}

export function MilitaryExperience({
  selectedCategory,
  hasMilitaryPeriod,
  militaryStart,
  militaryEnd,
  civilMonths,
  militaryMonths,
  totalExpMonths,
}: MilitaryExperienceProps) {
  const router = useRouter()
  const [checked, setChecked] = useState(hasMilitaryPeriod)
  const [startDate, setStartDate] = useState(militaryStart)
  const [endDate, setEndDate] = useState(militaryEnd ?? '')
  const [saving, setSaving] = useState(false)

  const expReq = EXPERIENCE_REQUIREMENTS[selectedCategory]
  if (!expReq) return null

  const civilRequired = militaryMonths > 0
    ? Math.max(MIN_CIVIL_MONTHS, (expReq.years * 12) - militaryMonths)
    : expReq.years * 12
  const civilRemaining = Math.max(0, civilRequired - civilMonths)

  async function handleSave() {
    if (!startDate) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    await supabase
      .from('employment_periods')
      .delete()
      .eq('user_id', user.id)
      .eq('is_military', true)

    await supabase
      .from('employment_periods')
      .insert({
        user_id: user.id,
        employer: 'Military / Non-Civil Service',
        start_date: startDate,
        end_date: endDate || null,
        is_military: true,
      })

    setSaving(false)
    router.refresh()
  }

  async function handleRemove() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    await supabase
      .from('employment_periods')
      .delete()
      .eq('user_id', user.id)
      .eq('is_military', true)

    setChecked(false)
    setStartDate('')
    setEndDate('')
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl p-5">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => setChecked(e.target.checked)}
          className="h-5 w-5 rounded border-gray-300 mt-0.5 shrink-0"
        />
        <div>
          <span className="text-sm font-medium text-gray-900">Military Experience</span>
          <p className="text-xs text-gray-400">Up to four years of aircraft maintenance experience in the military may be counted towards the issue of a licence.</p>
        </div>
      </label>

      {checked && (
        <div className="mt-4 pl-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">End Date (blank if current)</label>
              <Input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button size="sm" onClick={handleSave} disabled={saving || !startDate}>
              {saving ? 'Saving...' : hasMilitaryPeriod ? 'Update' : 'Save'}
            </Button>
            {hasMilitaryPeriod && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={saving}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>

          {militaryMonths > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-900">
                You have {formatDuration(militaryMonths)} military experience, therefore you need {formatDuration(civilRemaining)} more civil experience for {selectedCategory}.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
