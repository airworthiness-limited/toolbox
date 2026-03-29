'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface TrainingDateInputProps {
  slug: string
  label: string
}

export function TrainingDateInput({ slug, label }: TrainingDateInputProps) {
  const router = useRouter()
  const [date, setDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')

  async function handleSaveDate() {
    if (!date) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    // Find or create a certificate record for this training
    const { error } = await supabase
      .from('certificates')
      .upsert({
        user_id: user.id,
        course_slug: slug,
        issued_at: date,
      }, { onConflict: 'user_id,course_slug' })

    setSaving(false)
    if (!error) router.refresh()
  }

  async function handleUpload(file: File) {
    setUploading(true)
    setUploadMsg('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }

    const path = `training/${user.id}/${slug}-${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage
      .from('certificates')
      .upload(path, file)

    setUploading(false)
    if (error) {
      setUploadMsg('Upload failed')
    } else {
      setUploadMsg('Certificate uploaded')
    }
  }

  return (
    <div className="mt-2 space-y-2">
      <p className="text-sm text-gray-400">No certificate on record. If completed with another provider, enter the date below.</p>
      <div className="flex items-center gap-3">
        <Input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="text-sm w-40"
        />
        <Button size="sm" onClick={handleSaveDate} disabled={saving || !date}>
          {saving ? 'Saving...' : 'Save Date'}
        </Button>
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) handleUpload(file)
            }}
          />
          <span className="inline-flex items-center px-3 py-1.5 rounded-md border text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            {uploading ? 'Uploading...' : 'Upload Certificate'}
          </span>
        </label>
        {uploadMsg && <span className="text-xs text-green-600">{uploadMsg}</span>}
      </div>
    </div>
  )
}
