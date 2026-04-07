'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const HANDLE_REGEX = /^[a-z0-9-]{3,30}$/
const MAX_AVATAR_BYTES = 2 * 1024 * 1024 // 2 MB
const AVATAR_DIMENSION = 512 // re-encoded square
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface Props {
  currentHandle: string
  initialAvatarUrl: string | null
}

/**
 * Re-encode an image file to a JPEG Blob via canvas. This strips EXIF
 * metadata as a side effect of canvas serialisation — the canvas does
 * not preserve image metadata, so the output Blob has none.
 *
 * Also resizes to a max dimension of AVATAR_DIMENSION while preserving
 * aspect ratio (centred crop to a square for consistency on the profile
 * page).
 */
async function reencodeImage(file: File): Promise<Blob> {
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

  // Centre-crop to a square
  const size = Math.min(img.width, img.height)
  const sx = (img.width - size) / 2
  const sy = (img.height - size) / 2

  const canvas = document.createElement('canvas')
  canvas.width = AVATAR_DIMENSION
  canvas.height = AVATAR_DIMENSION
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.drawImage(img, sx, sy, size, size, 0, 0, AVATAR_DIMENSION, AVATAR_DIMENSION)

  const blob = await new Promise<Blob | null>(resolve =>
    canvas.toBlob(resolve, 'image/jpeg', 0.9)
  )
  if (!blob) throw new Error('Failed to encode image')
  return blob
}

export function HandleForm({ currentHandle, initialAvatarUrl }: Props) {
  const router = useRouter()

  // Handle state
  const [handle, setHandle] = useState(currentHandle)
  const [handleBusy, setHandleBusy] = useState(false)
  const [handleError, setHandleError] = useState<string | null>(null)
  const [handleSuccess, setHandleSuccess] = useState(false)

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function validateHandle(value: string): string | null {
    if (!value) return 'Handle is required'
    if (!HANDLE_REGEX.test(value)) {
      return 'Handle must be 3-30 characters: lowercase letters, numbers, and hyphens only'
    }
    return null
  }

  async function saveHandle() {
    const v = handle.trim().toLowerCase()
    const validationError = validateHandle(v)
    if (validationError) {
      setHandleError(validationError)
      return
    }
    setHandleError(null)
    setHandleSuccess(false)
    setHandleBusy(true)
    const res = await fetch('/api/profile/public/handle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle: v }),
    })
    setHandleBusy(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setHandleError(body.error ?? 'Failed to save handle')
      return
    }
    setHandleSuccess(true)
    setHandle(v)
    router.refresh()
  }

  async function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarError(null)

    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError('File too large (max 2 MB)')
      e.target.value = ''
      return
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setAvatarError('Only JPEG, PNG, and WebP images are supported')
      e.target.value = ''
      return
    }

    setAvatarBusy(true)
    try {
      // Client-side re-encode strips EXIF and resizes to 512x512
      const blob = await reencodeImage(file)

      const formData = new FormData()
      formData.append('file', blob, 'avatar.jpg')

      const res = await fetch('/api/profile/public/avatar', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setAvatarError(body.error ?? 'Failed to upload avatar')
        return
      }

      const data = await res.json()
      setAvatarUrl(data.url)
      router.refresh()
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Failed to process image')
    } finally {
      setAvatarBusy(false)
      e.target.value = ''
    }
  }

  async function removeAvatar() {
    if (!window.confirm('Remove your profile photo?')) return
    setAvatarError(null)
    setAvatarBusy(true)
    const res = await fetch('/api/profile/public/avatar', { method: 'DELETE' })
    setAvatarBusy(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setAvatarError(body.error ?? 'Failed to remove avatar')
      return
    }
    setAvatarUrl(null)
    router.refresh()
  }

  return (
    <>
      {/* Avatar */}
      <div className="rounded-xl border border-border p-5 space-y-4">
        <div>
          <p className="text-sm font-medium text-foreground">Profile photo</p>
          <p className="text-sm text-muted-foreground mt-1">
            Optional. Square images work best. Max 2 MB. JPEG, PNG, or WebP.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover border border-border/60" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-muted border border-border/60" />
          )}
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarPick}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarBusy}
            >
              {avatarBusy ? 'Uploading...' : avatarUrl ? 'Change photo' : 'Upload photo'}
            </Button>
            {avatarUrl && (
              <Button variant="outline" size="sm" onClick={removeAvatar} disabled={avatarBusy}>
                Remove
              </Button>
            )}
          </div>
        </div>
        {avatarError && <p className="text-sm text-red-600">{avatarError}</p>}
      </div>

      {/* Handle */}
      <div className="rounded-xl border border-border p-5 space-y-4">
        <div>
          <p className="text-sm font-medium text-foreground">Handle</p>
          <p className="text-sm text-muted-foreground mt-1">
            Your handle is the URL of your public profile. Choose something professional — your CV may link to it.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="handle" className="sr-only">Handle</Label>
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground whitespace-nowrap">airworthiness.org.uk/u/</span>
            <Input
              id="handle"
              value={handle}
              onChange={e => { setHandle(e.target.value.toLowerCase()); setHandleError(null); setHandleSuccess(false) }}
              placeholder="alex-king"
              className="h-10 rounded-xl flex-1"
              maxLength={30}
            />
          </div>
          <p className="text-xs text-muted-foreground">3-30 characters. Lowercase letters, numbers, and hyphens only.</p>
        </div>

        {handleError && <p className="text-sm text-red-600">{handleError}</p>}
        {handleSuccess && <p className="text-sm text-green-600">Saved.</p>}

        <div className="flex gap-2">
          <Button onClick={saveHandle} disabled={handleBusy || (handle === currentHandle && !handleError)} size="sm">
            {handleBusy ? 'Saving...' : 'Save handle'}
          </Button>
          <Link href={`/u/${handle}`} target="_blank">
            <Button variant="outline" size="sm" disabled={!!handleError}>
              View profile
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="outline" size="sm">Back to settings</Button>
          </Link>
        </div>
      </div>
    </>
  )
}
