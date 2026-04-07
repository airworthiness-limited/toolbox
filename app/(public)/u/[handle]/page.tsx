import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isFeatureEnabled } from '@/lib/feature-flags'
import { Button } from '@/components/ui/button'
import { FollowButton } from './follow-button'

interface PageProps {
  params: Promise<{ handle: string }>
}

const HANDLE_REGEX = /^[a-z0-9-]{3,30}$/
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://airworthiness.org.uk'

// Allow Vercel/CDN to cache public profile pages for 60 seconds.
// This bounds the propagation delay of profile updates and the kill switch.
export const revalidate = 60

/**
 * The public profile page.
 *
 * Visible to anyone (logged in or not). Returns a generic 404 if:
 * - the handle does not match the format
 * - no profile with that handle exists
 * - the profile exists but is_public = false
 *
 * The 404 is deliberately generic — we do not leak whether a handle is
 * "taken but private" vs "does not exist".
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params
  const notFoundMeta: Metadata = { title: 'Profile not found', robots: { index: false, follow: false } }

  if (!HANDLE_REGEX.test(handle)) return notFoundMeta
  if (!(await isFeatureEnabled('social_profile'))) return notFoundMeta

  const supabase = await createClient()
  const { data } = await supabase.rpc('get_public_profile', { p_handle: handle })
  const profile = data?.[0]
  if (!profile) return notFoundMeta

  let name = profile.display_name || profile.full_name || 'Engineer'
  if (profile.display_name_first_only && name.includes(' ')) {
    name = name.split(' ')[0]
  }

  const canonical = `${SITE_URL}/u/${handle}`

  // Build a description from available data — categories and type ratings count
  const categories = (profile.aml_categories ?? []).join(', ')
  const typeRatingCount = Array.isArray(profile.type_ratings) ? profile.type_ratings.length : 0
  const descParts = []
  if (categories) descParts.push(`UK CAA ${categories} licence holder`)
  if (typeRatingCount > 0) descParts.push(`${typeRatingCount} type rating${typeRatingCount === 1 ? '' : 's'}`)
  const description = descParts.length > 0
    ? `${name} — ${descParts.join(' · ')}.`
    : `${name} on Airworthiness.`

  const ogImage = profile.avatar_path
    ? supabase.storage.from('public-profile-avatars').getPublicUrl(profile.avatar_path).data.publicUrl
    : undefined

  return {
    title: `${name} | Airworthiness`,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title: name,
      description,
      url: canonical,
      siteName: 'Airworthiness',
      type: 'profile',
      images: ogImage ? [{ url: ogImage, width: 512, height: 512, alt: name }] : undefined,
    },
    twitter: {
      card: ogImage ? 'summary' : 'summary',
      title: name,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { handle } = await params

  if (!HANDLE_REGEX.test(handle)) notFound()

  // Kill switch: if the social_profile flag is off, all public profiles
  // become 404 immediately. This is the incident response path — flipping
  // the flag hides every public profile within 60 seconds.
  if (!(await isFeatureEnabled('social_profile'))) notFound()

  const supabase = await createClient()

  // Single security-definer call returns only the public-safe fields,
  // with is_public = true enforced inside the function.
  const { data: rows } = await supabase.rpc('get_public_profile', { p_handle: handle })
  const profile = rows?.[0]

  if (!profile) notFound()

  // Compute display name
  let displayName = profile.display_name || profile.full_name || 'Engineer'
  if (profile.display_name_first_only && displayName.includes(' ')) {
    displayName = displayName.split(' ')[0]
  }

  // Type ratings — normalise the JSON-stringified entries from the existing schema
  const typeRatings: Array<{ rating: string }> = (() => {
    const raw = profile.type_ratings
    if (!Array.isArray(raw)) return []
    return raw
      .map((item: unknown) => {
        if (typeof item === 'string') {
          try {
            const parsed = JSON.parse(item)
            return { rating: parsed.rating ?? item }
          } catch {
            return { rating: item }
          }
        }
        if (typeof item === 'object' && item !== null && 'rating' in item) {
          return { rating: String((item as { rating: unknown }).rating) }
        }
        return null
      })
      .filter((x): x is { rating: string } => x !== null && !!x.rating)
  })()

  // Years in industry — separate security definer function so we don't have
  // to expose employment_periods to anon
  let yearsInIndustry: number | null = null
  if (profile.show_years_in_industry) {
    const { data: years } = await supabase.rpc('get_public_profile_years_in_industry', {
      p_handle: handle,
    })
    if (typeof years === 'number') yearsInIndustry = years
  }

  // Phase 2: follower / following counts and current user's follow state
  const followEnabled = await isFeatureEnabled('social_follow')
  let followerCount = 0
  let followingCount = 0
  let followState: 'none' | 'pending' | 'active' | 'self' = 'none'

  if (followEnabled) {
    const [{ data: fc }, { data: gc }, { data: fs }] = await Promise.all([
      supabase.rpc('get_follower_count', { p_handle: handle }),
      supabase.rpc('get_following_count', { p_handle: handle }),
      supabase.rpc('get_follow_state', { p_handle: handle }),
    ])
    if (typeof fc === 'number') followerCount = fc
    if (typeof gc === 'number') followingCount = gc
    if (typeof fs === 'string' && (fs === 'none' || fs === 'pending' || fs === 'active' || fs === 'self')) {
      followState = fs
    }
  }

  // Avatar URL from storage (public bucket, no signed URL needed)
  const avatarUrl = profile.avatar_path
    ? supabase.storage.from('public-profile-avatars').getPublicUrl(profile.avatar_path).data.publicUrl
    : null

  return (
    <div className="bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-start gap-5 mb-10">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="w-20 h-20 rounded-full object-cover border border-border/60"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border border-border/60">
              <span className="text-2xl font-semibold text-muted-foreground">
                {displayName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold text-foreground">{displayName}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">@{profile.handle}</p>
            {profile.show_employment_status && profile.employment_type && (
              <p className="text-sm text-muted-foreground mt-2 capitalize">
                {profile.employment_type}
              </p>
            )}
            {followEnabled && (
              <div className="flex items-center gap-4 mt-3 text-sm">
                <span>
                  <span className="font-semibold text-foreground">{followerCount}</span>
                  <span className="text-muted-foreground"> {followerCount === 1 ? 'follower' : 'followers'}</span>
                </span>
                <span>
                  <span className="text-muted-foreground">Following </span>
                  <span className="font-semibold text-foreground">{followingCount}</span>
                </span>
              </div>
            )}
          </div>
          {followEnabled && followState !== 'self' && (
            <FollowButton targetHandle={profile.handle} initialState={followState} />
          )}
        </div>

        {/* Licence categories */}
        {profile.aml_categories && profile.aml_categories.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Licence categories
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.aml_categories.map((cat: string) => (
                <span
                  key={cat}
                  className="inline-flex items-center rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground"
                >
                  {cat}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Type rating trophy case — the centrepiece */}
        {typeRatings.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Type ratings
            </h2>
            <div className="flex flex-wrap gap-2">
              {typeRatings.map(t => (
                <span
                  key={t.rating}
                  className="inline-flex items-center rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground"
                >
                  {t.rating}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Optional sections */}
        {profile.show_years_in_industry && yearsInIndustry !== null && (
          <section className="mb-6">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{yearsInIndustry}</span> {yearsInIndustry === 1 ? 'year' : 'years'} in industry
            </p>
          </section>
        )}

        {/* Empty state — if everything is empty/disabled */}
        {typeRatings.length === 0 &&
         (!profile.aml_categories || profile.aml_categories.length === 0) && (
          <p className="text-sm text-muted-foreground">
            This profile has not yet added any licence credentials.
          </p>
        )}

        {/* Sign-up CTA */}
        <section className="mt-16 pt-8 border-t border-border/60">
          <p className="text-sm text-muted-foreground mb-3">
            Airworthiness is a free professional tool for UK Aircraft Maintenance Licence holders.
          </p>
          <Link href="/">
            <Button size="sm">Create your own profile</Button>
          </Link>
        </section>
      </div>
    </div>
  )
}
