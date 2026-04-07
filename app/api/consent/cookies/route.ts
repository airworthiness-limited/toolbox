import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logPrivacyEvent } from '@/lib/privacy-audit'

/**
 * Records cookie consent for authenticated users.
 *
 * Anonymous users still get the banner (their consent is stored in
 * localStorage only, since there's no account to associate it with).
 * Authenticated users get a server-side audit entry as well, which is
 * the GDPR-defensible record of consent.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body || (body.choice !== 'accepted' && body.choice !== 'rejected')) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Anonymous users — nothing to log server-side
  if (!user) {
    return NextResponse.json({ success: true, logged: false })
  }

  await logPrivacyEvent({
    eventType: body.choice === 'accepted' ? 'cookies_accepted' : 'cookies_rejected',
    eventCategory: 'consent',
    metadata: { source: 'cookie_banner' },
  })

  return NextResponse.json({ success: true, logged: true })
}
