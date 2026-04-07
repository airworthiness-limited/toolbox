import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isFeatureEnabled } from '@/lib/feature-flags'
import { logPrivacyEvent } from '@/lib/privacy-audit'

const MAX_BYTES = 2 * 1024 * 1024 // 2 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

/**
 * Avatar upload for the public profile.
 *
 * The client is expected to re-encode the image via Canvas before upload,
 * which strips EXIF and other metadata as a side effect of canvas
 * serialisation. The server validates type and size as defence in depth
 * but does not strip EXIF itself (no sharp dependency).
 *
 * The file is stored at {user_id}/{timestamp}.{ext} in the
 * `public-profile-avatars` bucket. We include a timestamp so the URL
 * changes on every replacement, defeating CDN caching.
 *
 * On success, updates public_profiles.avatar_path and deletes the
 * previous avatar from storage.
 */
export async function POST(request: Request) {
  if (!(await isFeatureEnabled('social_profile'))) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // Verify the user has a public profile to attach the avatar to
  const { data: profile } = await supabase
    .from('public_profiles')
    .select('avatar_path')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!profile) {
    return NextResponse.json(
      { error: 'You must enable a public profile before uploading an avatar' },
      { status: 400 }
    )
  }

  // Parse multipart/form-data
  const formData = await request.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

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

  // Build the storage path. Timestamp suffix ensures the URL changes on
  // every upload (defeats CDN caching of the old avatar).
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const timestamp = Date.now()
  const path = `${user.id}/${timestamp}.${ext}`

  // Upload to storage
  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('public-profile-avatars')
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Update the profile
  const { error: updateError } = await supabase
    .from('public_profiles')
    .update({ avatar_path: path })
    .eq('user_id', user.id)

  if (updateError) {
    // Try to clean up the orphaned upload
    await supabase.storage.from('public-profile-avatars').remove([path])
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Best-effort cleanup of the previous avatar
  if (profile.avatar_path && profile.avatar_path !== path) {
    await supabase.storage.from('public-profile-avatars').remove([profile.avatar_path])
  }

  await logPrivacyEvent({
    eventType: 'avatar_uploaded',
    eventCategory: 'profile',
    metadata: { size_bytes: file.size, content_type: file.type },
  })

  // Return the public URL so the UI can display it immediately
  const { data: urlData } = supabase.storage
    .from('public-profile-avatars')
    .getPublicUrl(path)

  return NextResponse.json({ success: true, path, url: urlData.publicUrl })
}

/**
 * Delete the user's avatar.
 */
export async function DELETE() {
  if (!(await isFeatureEnabled('social_profile'))) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('public_profiles')
    .select('avatar_path')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile?.avatar_path) {
    return NextResponse.json({ success: true, alreadyEmpty: true })
  }

  // Remove from storage first; if that fails, leave the path so the user can retry
  await supabase.storage.from('public-profile-avatars').remove([profile.avatar_path])

  const { error } = await supabase
    .from('public_profiles')
    .update({ avatar_path: null })
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logPrivacyEvent({
    eventType: 'avatar_removed',
    eventCategory: 'profile',
  })

  return NextResponse.json({ success: true })
}
