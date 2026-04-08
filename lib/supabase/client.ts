import { createBrowserClient } from '@supabase/ssr'

// Share auth cookies across all airworthiness.org.uk subdomains
// (toolbox., market., apex marketing site) so sessions persist
// when navigating between them. In local dev, leave the cookie
// scoped to localhost.
const COOKIE_DOMAIN =
  typeof window !== 'undefined' &&
  window.location.hostname.endsWith('airworthiness.org.uk')
    ? '.airworthiness.org.uk'
    : undefined

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    COOKIE_DOMAIN
      ? { cookieOptions: { domain: COOKIE_DOMAIN } }
      : undefined
  )
}