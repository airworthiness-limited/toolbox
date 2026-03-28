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

  const meetsFullExp = totalExpMonths >= expReq.years * 12
  const meetsCivilMin = civilMonths >= MIN_CIVIL_MONTHS

  // Calculate how many months of civil experience still needed
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

    // Delete any existing military periods for this user first
    await supabase
      .from('employment_periods')
      .delete()
      .eq('user_id', user.id)
      .eq('is_military', true)

    // Insert the new military period
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
          <span className="text-sm font-medium text-gray-900">Military Experience?</span>
          <p className="text-xs text-gray-400">I have aircraft maintenance experience from military or non-civil aviation service.</p>
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

          {/* Calculator */}
          {militaryMonths > 0 && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Military</p>
                  <p className="font-bold text-gray-900">{Math.floor(militaryMonths / 12)}y {militaryMonths % 12}m</p>
                </div>
                <div>
                  <p className="text-gray-500">Civil</p>
                  <p className="font-bold text-gray-900">{Math.floor(civilMonths / 12)}y {civilMonths % 12}m</p>
                </div>
                <div>
                  <p className="text-gray-500">Total</p>
                  <p className={`font-bold ${meetsFullExp && meetsCivilMin ? 'text-green-600' : 'text-gray-900'}`}>
                    {Math.floor(totalExpMonths / 12)}y {totalExpMonths % 12}m
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Required: {expReq.years} years (or {expReq.yearsWithBtc} year{expReq.yearsWithBtc > 1 ? 's' : ''} with Part 147 BTC)
              </p>
              {civilRemaining > 0 ? (
                <p className="text-xs text-amber-600 font-medium">
                  You need {Math.floor(civilRemaining / 12) > 0 ? `${Math.floor(civilRemaining / 12)} year${Math.floor(civilRemaining / 12) > 1 ? 's' : ''} ` : ''}{civilRemaining % 12 > 0 ? `${civilRemaining % 12} month${civilRemaining % 12 > 1 ? 's' : ''}` : ''} more civil experience for {selectedCategory}.
                </p>
              ) : (
                <p className="text-xs text-green-600 font-bold">Experience requirement met for {selectedCategory}.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
