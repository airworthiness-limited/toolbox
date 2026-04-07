import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isFeatureEnabledForUser } from '@/lib/feature-flags'

const MAX_BYTES = 4 * 1024 * 1024 // 4 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

/**
 * Upload a single photo for an upcoming post.
 *
 * This is called BEFORE the post is created. The client uploads each
 * photo individually, gets back a path, then submits the share-task
 * call with the array of paths.
 *
 * The server validates type and size; the client is expected to have
 * re-encoded via canvas to strip EXIF (same approach as profile avatars).
 *
 * Path format: {user_id}/orphan/{timestamp}-{random}.{ext}
 * "orphan" because at upload time the post doesn't exist yet. After
 * the post is created, the share-task API can keep the path as-is or
 * move it; for simplicity we leave it where it is.
 *
 * Orphaned photos (uploaded but never referenced by a post) are accepted
 * as a small leak — they get cleaned up when the user is deleted (cascade
 * via the user-id-prefixed path), and a future cleanup job can prune
 * old orphans on a schedule.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!(await isFeatureEnabledForUser('social_task_posts', user.id))) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  const formData = await request.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file field is required' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large (max ${MAX_BYTES / 1024 / 1024} MB)` },
      { status: 400 }
    )
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Only JPEG, PNG, and WebP images are allowed' },
      { status: 400 }
    )
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const random = Math.random().toString(36).slice(2, 10)
  const path = `${user.id}/orphan/${Date.now()}-${random}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('post-photos')
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from('post-photos').getPublicUrl(path)

  return NextResponse.json({ success: true, path, url: urlData.publicUrl })
}
