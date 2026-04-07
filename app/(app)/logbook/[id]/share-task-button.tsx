'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Rss, X, ImagePlus } from 'lucide-react'
import { MAX_TASK_NOTE_LENGTH, MAX_TASK_PHOTOS } from '@/lib/post-types'

interface Props {
  logbookEntryId: string
  /** Short preview of what will be shared, e.g. "Boeing 737 MAX · Inspect/Test, Modification" */
  preview: string
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 4 * 1024 * 1024

interface UploadedPhoto {
  path: string
  url: string
}

/**
 * Re-encode an image via canvas to strip EXIF (same approach as the
 * profile avatar upload). The output is a JPEG Blob.
 *
 * Resizes the longer side to maxDimension to keep file sizes reasonable.
 */
async function reencodeImage(file: File, maxDimension = 1600): Promise<Blob> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = () => reject(new Error('Failed to decode image'))
    i.src = dataUrl
  })

  // Scale so the longer side is maxDimension; preserve aspect ratio
  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
  const w = Math.round(img.width * scale)
  const h = Math.round(img.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.drawImage(img, 0, 0, w, h)

  const blob = await new Promise<Blob | null>(resolve =>
    canvas.toBlob(resolve, 'image/jpeg', 0.85)
  )
  if (!blob) throw new Error('Failed to encode image')
  return blob
}

export function ShareTaskButton({ logbookEntryId, preview }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [photos, setPhotos] = useState<UploadedPhoto[]>([])
  const [uploading, setUploading] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setNote('')
    setPhotos([])
    setError(null)
  }

  async function handlePickPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return

    if (photos.length + files.length > MAX_TASK_PHOTOS) {
      setError(`Maximum ${MAX_TASK_PHOTOS} photos per post`)
      return
    }

    setError(null)
    setUploading(true)
    try {
      for (const file of files) {
        if (file.size > MAX_BYTES) {
          setError(`${file.name}: file too large (max 4 MB)`)
          continue
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
          setError(`${file.name}: only JPEG, PNG, WebP allowed`)
          continue
        }
        const blob = await reencodeImage(file)
        const formData = new FormData()
        formData.append('file', blob, 'photo.jpg')
        const res = await fetch('/api/posts/photos', { method: 'POST', body: formData })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          setError(body.error ?? 'Failed to upload photo')
          continue
        }
        const data = await res.json()
        setPhotos(prev => [...prev, { path: data.path, url: data.url }])
      }
    } finally {
      setUploading(false)
    }
  }

  function removePhoto(index: number) {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  async function share() {
    setError(null)
    setSharing(true)
    const res = await fetch('/api/posts/share-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        logbook_entry_id: logbookEntryId,
        note: note.trim() || undefined,
        photoPaths: photos.map(p => p.path),
      }),
    })
    setSharing(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Failed to share')
      return
    }
    setOpen(false)
    reset()
    router.refresh()
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Rss className="w-4 h-4 mr-2" strokeWidth={1.5} />
        Share to feed
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
          onClick={() => { if (!sharing && !uploading) { setOpen(false); reset() } }}
        >
          <div
            className="bg-card rounded-2xl border border-border shadow-xl max-w-md w-full p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div>
              <h3 className="text-lg font-semibold text-foreground">Share to feed</h3>
              <p className="text-sm text-muted-foreground mt-1">{preview}</p>
            </div>

            {/* Note */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="note">
                Optional note ({MAX_TASK_NOTE_LENGTH - note.length} characters left)
              </label>
              <textarea
                id="note"
                value={note}
                onChange={e => setNote(e.target.value.slice(0, MAX_TASK_NOTE_LENGTH))}
                rows={3}
                placeholder="Unscheduled engine change at Leeds Bradford Airport today out on the line."
                className="w-full text-sm px-3 py-2 border border-border rounded-xl bg-background resize-none placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* Photos */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Optional photos ({photos.length}/{MAX_TASK_PHOTOS})
              </label>
              {photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((p, i) => (
                    <div key={p.path} className="relative aspect-square">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt="" className="w-full h-full object-cover rounded-lg border border-border/60" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center"
                        aria-label="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {photos.length < MAX_TASK_PHOTOS && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <ImagePlus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                  {uploading ? 'Uploading...' : 'Add photos'}
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handlePickPhotos}
                className="hidden"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setOpen(false); reset() }}
                disabled={sharing || uploading}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={share} disabled={sharing || uploading}>
                {sharing ? 'Sharing...' : 'Share'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
