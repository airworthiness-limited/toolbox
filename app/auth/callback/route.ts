import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/profile'

  // Collect cookies Supabase wants to set, then apply them to the response.
  // Using request.cookies (not cookies() from next/headers) ensures they are
  // written onto the HTTP response and reach the browser after the redirect.
  const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(toSet) {
          toSet.forEach(({ name, value, options }) => {
            cookiesToSet.push({ name, value, options: options as Record<string, unknown> })
          })
        },
      },
    }
  )

  let redirectPath: string | null = null

  // Handle PKCE flow (code exchange)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) redirectPath = next
  }

  // Handle token hash flow (email links for recovery, email verification, etc.)
  if (!redirectPath && token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as 'recovery' | 'email' | 'signup',
      token_hash,
    })
    if (!error) {
      redirectPath = type === 'recovery' ? '/reset-password' : next
    }
  }

  const response = redirectPath
    ? NextResponse.redirect(`${origin}${redirectPath}`)
    : NextResponse.redirect(`${origin}/signup?mode=login`)

  // Write session cookies onto the redirect response so the browser stores them
  cookiesToSet.forEach(({ name, value, options }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response.cookies.set(name, value, options as any)
  })

  return response
}
