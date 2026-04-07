import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isFeatureEnabledForUser } from '@/lib/feature-flags'
import { logPrivacyEvent } from '@/lib/privacy-audit'
import { POST_TYPES } from '@/lib/post-types'

/**
 * Share a logbook entry to the feed.
 *
 * Body: {
 *   logbook_entry_id: string,
 *   note?: string (max 140 chars),
 *   photoPaths?: string[] (max 4),
 *   visibility?: 'followers' | 'public'
 * }
 *
 * Loads the logbook entry, verifies ownership, builds a structured task_share
 * post payload from the entry data (NEVER including operator/registration —
 * only technical fields), validates, and inserts.
 *
 * The user must:
 * - Have a public profile (otherwise no one can see the post)
 * - Be in the social_task_posts allowlist (or the flag is in full launch)
 * - Own the logbook entry being shared
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!(await isFeatureEnabledForUser('social_task_posts', user.id))) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  // Verify the user has a public profile
  const { data: profile } = await supabase
    .from('public_profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!profile) {
    return NextResponse.json(
      { error: 'You must enable a public profile before sharing to the feed' },
      { status: 400 }
    )
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body.logbook_entry_id !== 'string') {
    return NextResponse.json({ error: 'logbook_entry_id is required' }, { status: 400 })
  }

  // Load the logbook entry and verify ownership
  const { data: entry } = await supabase
    .from('logbook_entries')
    .select('id, user_id, task_date, aircraft_type, aircraft_category, ata_chapters, ata_chapter, description')
    .eq('id', body.logbook_entry_id)
    .maybeSingle()

  if (!entry) {
    return NextResponse.json({ error: 'Logbook entry not found' }, { status: 404 })
  }

  if (entry.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Extract task types from the description (the existing format prefixes
  // task types in square brackets, e.g. "[Inspect/Test, Modification] ...")
  const taskTypeMatch = entry.description?.match(/^\[([^\]]+)\]/)
  const taskTypes = taskTypeMatch
    ? taskTypeMatch[1].split(',').map((s: string) => s.trim()).filter(Boolean)
    : []

  // Build the task_share payload — STRICTLY no operator or registration data
  const ataChapters: string[] = Array.isArray(entry.ata_chapters) && entry.ata_chapters.length > 0
    ? (entry.ata_chapters as string[])
    : entry.ata_chapter ? [entry.ata_chapter] : []

  const taskSharePayload = {
    aircraft_type: entry.aircraft_type === 'N/A' ? null : entry.aircraft_type,
    aircraft_category: entry.aircraft_category ?? null,
    task_types: taskTypes,
    ata_chapters: ataChapters,
    task_date: entry.task_date,
    note: typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null,
    photos: Array.isArray(body.photoPaths) ? body.photoPaths : [],
  }

  const validation = POST_TYPES.task_share.validate(taskSharePayload)
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const visibility = body.visibility === 'public' ? 'public' : 'followers'

  const { data: insertedPost, error } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      post_type: 'task_share',
      data: validation.data,
      visibility,
    })
    .select('id, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logPrivacyEvent({
    eventType: 'task_shared',
    eventCategory: 'social',
    metadata: {
      post_id: insertedPost.id,
      logbook_entry_id: body.logbook_entry_id,
      photo_count: taskSharePayload.photos.length,
      has_note: !!taskSharePayload.note,
      visibility,
    },
  })

  return NextResponse.json({ success: true, post_id: insertedPost.id, created_at: insertedPost.created_at })
}
