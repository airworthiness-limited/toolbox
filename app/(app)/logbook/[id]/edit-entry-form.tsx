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
import type { LogbookEntry } from '@/lib/logbook/types'

interface Props {
  entry: LogbookEntry
  employers: string[]
}

export function EditEntryForm({ entry, employers }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [taskDate, setTaskDate] = useState(entry.task_date)
  const [aircraftType, setAircraftType] = useState(entry.aircraft_type)
  const [aircraftRegistration, setAircraftRegistration] = useState(entry.aircraft_registration)
  const [ataChapter, setAtaChapter] = useState(entry.ata_chapter)
  const [description, setDescription] = useState(entry.description)
  const [category, setCategory] = useState<string>(entry.category)
  const [aircraftCategory, setAircraftCategory] = useState<string>(entry.aircraft_category)
  const [durationHours, setDurationHours] = useState(String(entry.duration_hours))
  const [employer, setEmployer] = useState(entry.employer)
  const [supervised, setSupervised] = useState(entry.supervised)
  const [jobNumber, setJobNumber] = useState(entry.job_number ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isValid = taskDate && aircraftType && aircraftRegistration && ataChapter
    && description && category && aircraftCategory && durationHours && employer

  async function handleSave() {
    if (!isValid) return
    setSaving(true)
    setError('')

    const { error: updateError } = await supabase
      .from('logbook_entries')
      .update({
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
        verifier_id: null,
        verifier_comments: null,
        verified_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', entry.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    router.push('/logbook')
  }

  async function handleDelete() {
    const { error: deleteError } = await supabase
      .from('logbook_entries')
      .delete()
      .eq('id', entry.id)

    if (deleteError) {
      setError(deleteError.message)
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
              <Input id="taskDate" type="date" value={taskDate} onChange={e => setTaskDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="durationHours">Duration (hours)</Label>
              <Input id="durationHours" type="number" step="0.25" min="0.25" value={durationHours} onChange={e => setDurationHours(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="aircraftType">Aircraft type</Label>
              <Input id="aircraftType" value={aircraftType} onChange={e => setAircraftType(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="aircraftRegistration">Registration</Label>
              <Input id="aircraftRegistration" value={aircraftRegistration} onChange={e => setAircraftRegistration(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Aircraft category</Label>
            <Select value={aircraftCategory} onValueChange={setAircraftCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
              <SelectTrigger><SelectValue /></SelectTrigger>
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
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MAINTENANCE_CATEGORIES.map(mc => (
                  <SelectItem key={mc.value} value={mc.value}>{mc.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Description of work carried out</Label>
            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} />
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
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {employers.map(emp => (
                    <SelectItem key={emp} value={emp}>{emp}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={employer} onChange={e => setEmployer(e.target.value)} />
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="jobNumber">Internal job / work order number (optional)</Label>
            <Input id="jobNumber" value={jobNumber} onChange={e => setJobNumber(e.target.value)} />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={supervised} onChange={e => setSupervised(e.target.checked)} className="accent-foreground w-4 h-4" />
            <span className="text-sm text-foreground">This task was supervised</span>
          </label>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={!isValid || saving} className="flex-1">
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
        {entry.status === 'draft' && (
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        )}
      </div>
    </div>
  )
}
