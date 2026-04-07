import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isFeatureEnabledForUser } from '@/lib/feature-flags'
import { logPrivacyEvent } from '@/lib/privacy-audit'

/**
 * Follow another user.
 *
 * Body: { targetHandle: string }
 *
 * Behaviour:
 * - If the target is the current user → 400
 * - If the target's profile is public → creates row with status='active'
 * - If the target's profile is private → creates row with status='pending'
 *   (Phase 2 does not yet differentiate, so the spec assumes the privacy
 *   field exists; for now we treat all profiles as public.)
 *
 * Returns the resulting follow state.
 *
 * NOTE: Phase 1 didn't add a 'private' column to public_profiles — only
 * is_public, which is the on/off toggle. Until private profiles are added,
 * follows always create with status='active'.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!(await isFeatureEnabledForUser('social_follow', user.id))) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body.targetHandle !== 'string') {
    return NextResponse.json({ error: 'targetHandle is required' }, { status: 400 })
  }

  // Resolve the target handle to a user_id (must be a public profile)
  const { data: target } = await supabase
    .from('public_profiles')
    .select('user_id, is_public')
    .eq('handle', body.targetHandle)
    .maybeSingle()

  if (!target || !target.is_public) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  if (target.user_id === user.id) {
    return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
  }

  // Insert the follow row. For now all follows are immediate (active).
  // When private profiles land, this will branch on a privacy field.
  const status = 'active'

  const { error } = await supabase
    .from('follows')
    .insert({
      follower_id: user.id,
      followed_id: target.user_id,
      status,
      accepted_at: status === 'active' ? new Date().toISOString() : null,
    })

  if (error) {
    if (error.code === '23505') {
      // Already following
      return NextResponse.json({ success: true, status, alreadyFollowing: true })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logPrivacyEvent({
    eventType: status === 'active' ? 'follow_created' : 'follow_requested',
    eventCategory: 'social',
    metadata: { target_handle: body.targetHandle },
  })

  return NextResponse.json({ success: true, status })
}

/**
 * Unfollow a user.
 *
 * Body: { targetHandle: string }
 *
 * Deletes the row where current user is the follower.
 */
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!(await isFeatureEnabledForUser('social_follow', user.id))) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body.targetHandle !== 'string') {
    return NextResponse.json({ error: 'targetHandle is required' }, { status: 400 })
  }

  const { data: target } = await supabase
    .from('public_profiles')
    .select('user_id')
    .eq('handle', body.targetHandle)
    .maybeSingle()

  if (!target) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('followed_id', target.user_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logPrivacyEvent({
    eventType: 'unfollowed',
    eventCategory: 'social',
    metadata: { target_handle: body.targetHandle },
  })

  return NextResponse.json({ success: true })
}
