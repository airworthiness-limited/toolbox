import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isFeatureEnabledForUser } from '@/lib/feature-flags'
import { logPrivacyEvent } from '@/lib/privacy-audit'

const VALID_TOGGLES = new Set([
  'show_employment_status',
  'show_years_in_industry',
  'show_apprenticeship',
  'show_continuation_training_status',
  'show_first_endorsement_dates',
  'display_name_first_only',
])

/**
 * Update one of the user's public profile visibility toggles.
 *
 * Body: { field: string, value: boolean }
 *
 * Only fields in the VALID_TOGGLES allowlist can be updated. The user
 * must already have a public_profiles row.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!(await isFeatureEnabledForUser('social_profile', user.id))) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body.field !== 'string' || typeof body.value !== 'boolean') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!VALID_TOGGLES.has(body.field)) {
    return NextResponse.json({ error: 'Unknown field' }, { status: 400 })
  }

  const { error } = await supabase
    .from('public_profiles')
    .update({ [body.field]: body.value })
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logPrivacyEvent({
    eventType: 'visibility_changed',
    eventCategory: 'profile',
    metadata: { field: body.field, value: body.value },
  })

  return NextResponse.json({ success: true })
}
