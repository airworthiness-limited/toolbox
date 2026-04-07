import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Dev-only login route. Hard-gated to non-production environments.
 *
 * Used to bypass the magic link flow when working on localhost — the
 * Supabase project's redirect URL allow list does not include localhost,
 * so magic links sent from dev redirect to the production site instead
 * of back to the dev server.
 *
 * The companion side: a temporary password is set on the user via SQL
 * before this is called, and cleared after.
 *
 * THIS ROUTE MUST NEVER WORK IN PRODUCTION.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body.email !== 'string' || typeof body.password !== 'string') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  return NextResponse.json({ success: true, user_id: data.user?.id })
}
