'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ExternalTrainingFormProps {
  slug: string
  existingDate: string | null
  existingCertificatePath: string | null
}

export function ExternalTrainingForm({ slug, existingDate, existingCertificatePath }: ExternalTrainingFormProps) {
  const router = useRouter()
  const [date, setDate] = useState(existingDate ?? '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [hasCertificate, setHasCertificate] = useState(!!existingCertificatePath)

  async function handleSaveDate() {
    if (!date) return
    setSaving(true)
    try {
      const res = await fetch('/api/profile/external-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ training_slug: slug, completion_date: date }),
      })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!date) {
      alert('Please save a completion date first.')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('slug', slug)

      const res = await fetch('/api/profile/upload-training-certificate', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        setHasCertificate(true)
        router.refresh()
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <p className="text-xs text-gray-400 mb-2">If completed with another provider:</p>
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-auto text-sm h-8"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleSaveDate}
          disabled={saving || !date}
          className="h-8 text-xs"
        >
          {saving ? 'Saving...' : 'Save Date'}
        </Button>
        <label className="cursor-pointer">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs pointer-events-none"
            disabled={uploading}
            asChild
          >
            <span>{uploading ? 'Uploading...' : hasCertificate ? 'Replace Certificate' : 'Upload Certificate'}</span>
          </Button>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleUpload}
            className="hidden"
          />
        </label>
      </div>
      {hasCertificate && (
        <p className="text-xs text-green-600 mt-1">Certificate uploaded</p>
      )}
    </div>
  )
}
