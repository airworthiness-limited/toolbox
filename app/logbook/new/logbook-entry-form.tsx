'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ATA_CHAPTERS,
  AIRCRAFT_CATEGORIES,
  MAINTENANCE_CATEGORIES,
} from '@/lib/logbook/constants'

interface Props {
  employers: string[]
}

export function LogbookEntryForm({ employers }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [taskDate, setTaskDate] = useState('')
  const [aircraftType, setAircraftType] = useState('')
  const [aircraftRegistration, setAircraftRegistration] = useState('')
  const [ataChapter, setAtaChapter] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [aircraftCategory, setAircraftCategory] = useState('')
  const [durationHours, setDurationHours] = useState('')
  const [employer, setEmployer] = useState('')
  const [supervised, setSupervised] = useState(true)
  const [jobNumber, setJobNumber] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isValid = taskDate && aircraftType && aircraftRegistration && ataChapter
    && description && category && aircraftCategory && durationHours && employer

  async function handleSave() {
    if (!isValid) return
    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { error: insertError } = await supabase
      .from('logbook_entries')
      .insert({
        user_id: user.id,
        task_date: taskDate,
        aircraft_type: aircraftType,
        aircraft_registration: aircraftRegistration.toUpperCase(),
        ata_chapter: ataChapter,
        description,
        category,
        aircraft_category: aircraftCategory,
        duration_hours: parseFloat(durationHours),
        employer,
        supervised,
        job_number: jobNumber || null,
        status: 'draft',
      })

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    router.push('/logbook')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="taskDate">Date of task</Label>
              <Input
                id="taskDate"
                type="date"
                value={taskDate}
                onChange={e => setTaskDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="durationHours">Duration (hours)</Label>
              <Input
                id="durationHours"
                type="number"
                step="0.25"
                min="0.25"
                value={durationHours}
                onChange={e => setDurationHours(e.target.value)}
                placeholder="e.g. 4.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="aircraftType">Aircraft type</Label>
              <Input
                id="aircraftType"
                value={aircraftType}
                onChange={e => setAircraftType(e.target.value)}
                placeholder="e.g. Boeing 737-800"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="aircraftRegistration">Registration</Label>
              <Input
                id="aircraftRegistration"
                value={aircraftRegistration}
                onChange={e => setAircraftRegistration(e.target.value)}
                placeholder="e.g. G-ABCD"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Aircraft category</Label>
            <Select value={aircraftCategory} onValueChange={setAircraftCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select aircraft category" />
              </SelectTrigger>
              <SelectContent>
                {AIRCRAFT_CATEGORIES.map(ac => (
                  <SelectItem key={ac.value} value={ac.value}>{ac.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>ATA chapter</Label>
            <Select value={ataChapter} onValueChange={setAtaChapter}>
              <SelectTrigger>
                <SelectValue placeholder="Select ATA chapter" />
              </SelectTrigger>
              <SelectContent>
                {ATA_CHAPTERS.map(ch => (
                  <SelectItem key={ch.value} value={ch.value}>{ch.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Maintenance category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select maintenance category" />
              </SelectTrigger>
              <SelectContent>
                {MAINTENANCE_CATEGORIES.map(mc => (
                  <SelectItem key={mc.value} value={mc.value}>{mc.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Description of work carried out</Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the maintenance task performed..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employment &amp; Supervision</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Employer</Label>
            {employers.length > 0 ? (
              <Select value={employer} onValueChange={setEmployer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employer" />
                </SelectTrigger>
                <SelectContent>
                  {employers.map(emp => (
                    <SelectItem key={emp} value={emp}>{emp}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div>
                <Input
                  value={employer}
                  onChange={e => setEmployer(e.target.value)}
                  placeholder="e.g. British Airways Engineering"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Add employers in your <a href="/logbook/employment" className="text-blue-600 hover:underline">employment history</a> to use a dropdown here.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="jobNumber">Internal job / work order number (optional)</Label>
            <Input
              id="jobNumber"
              value={jobNumber}
              onChange={e => setJobNumber(e.target.value)}
              placeholder="e.g. WO-2026-0451"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={supervised}
              onChange={e => setSupervised(e.target.checked)}
              className="accent-blue-600 w-4 h-4"
            />
            <span className="text-sm text-gray-700">This task was supervised</span>
          </label>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button onClick={handleSave} disabled={!isValid || saving} className="w-full">
        {saving ? 'Saving...' : 'Save as Draft'}
      </Button>
    </div>
  )
}
