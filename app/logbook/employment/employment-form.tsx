'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { EmploymentPeriod } from '@/lib/logbook/types'

interface Props {
  periods: EmploymentPeriod[]
}

export function EmploymentForm({ periods: initialPeriods }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [employer, setEmployer] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleAdd() {
    if (!employer || !startDate) return
    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { error: insertError } = await supabase
      .from('employment_periods')
      .insert({
        user_id: user.id,
        employer,
        start_date: startDate,
        end_date: endDate || null,
      })

    if (insertError) {
      setError(insertError.message)
    } else {
      setEmployer('')
      setStartDate('')
      setEndDate('')
      router.refresh()
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    await supabase.from('employment_periods').delete().eq('id', id)
    setDeletingId(null)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Existing periods */}
      {initialPeriods.length > 0 && (
        <div className="space-y-3">
          {initialPeriods.map(period => (
            <Card key={period.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium text-gray-900">{period.employer}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(period.start_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                    {' - '}
                    {period.end_date
                      ? new Date(period.end_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
                      : 'Present'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(period.id)}
                  disabled={deletingId === period.id}
                >
                  {deletingId === period.id ? 'Removing...' : 'Remove'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add new */}
      <Card>
        <CardHeader>
          <CardTitle>Add Employer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="employer">Employer / Organisation</Label>
            <Input
              id="employer"
              value={employer}
              onChange={e => setEmployer(e.target.value)}
              placeholder="e.g. British Airways Engineering"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="startDate">Start date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="endDate">End date (blank if current)</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button onClick={handleAdd} disabled={saving || !employer || !startDate}>
            {saving ? 'Adding...' : 'Add Employer'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
