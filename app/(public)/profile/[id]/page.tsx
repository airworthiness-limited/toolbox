export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { queryAll, queryOne } from '@/lib/db'
import { getPublicUrl } from '@/lib/storage'
import { isFeatureEnabled } from '@/lib/feature-flags'
import { Button } from '@/components/ui/button'
import { ProfileActions } from './profile-actions'

interface PageProps {
  params: Promise<{ id: string }>
}

const PUBLIC_ID_REGEX = /^[0-9]{8}$/
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://toolbox.airworthiness.org.uk'

// Allow Vercel/CDN to cache public profile pages for 60 seconds.
// This bounds the propagation delay of profile updates and the kill switch.
export const revalidate = 60

/**
 * The public profile page.
 *
 * Visible to anyone (logged in or not). Returns a generic 404 if:
 * - the id is not 8 digits
 * - no profile with that id exists
 * - the profile exists but is_public = false
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const notFoundMeta: Metadata = { title: 'Profile not found', robots: { index: false, follow: false } }

  if (!PUBLIC_ID_REGEX.test(id)) return notFoundMeta
  if (!(await isFeatureEnabled('social_profile'))) return notFoundMeta

  const rows = await queryAll('SELECT * FROM get_public_profile($1)', [id])
  const profile = rows?.[0]
  if (!profile) return notFoundMeta

  let name = profile.display_name || profile.full_name || 'Engineer'
  if (profile.display_name_first_only && name.includes(' ')) {
    name = name.split(' ')[0]
  }

  const canonical = `${SITE_URL}/profile/${id}`

  const categories = (profile.aml_categories ?? []).join(', ')
  const typeRatingCount = Array.isArray(profile.type_ratings) ? profile.type_ratings.length : 0
  const descParts = []
  if (categories) descParts.push(`UK CAA ${categories} licence holder`)
  if (typeRatingCount > 0) descParts.push(`${typeRatingCount} type rating${typeRatingCount === 1 ? '' : 's'}`)
  const description = descParts.length > 0
    ? `${name} — ${descParts.join(' · ')}.`
    : `${name} on Airworthiness.`

  const ogImage = profile.avatar_path
    ? getPublicUrl('public-profile-avatars', profile.avatar_path)
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
      card: 'summary',
      title: name,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { id } = await params

  if (!PUBLIC_ID_REGEX.test(id)) notFound()
  if (!(await isFeatureEnabled('social_profile'))) notFound()

  const rows = await queryAll('SELECT * FROM get_public_profile($1)', [id])
  const profile = rows?.[0]

  if (!profile) notFound()

  let displayName = profile.display_name || profile.full_name || 'Engineer'
  if (profile.display_name_first_only && displayName.includes(' ')) {
    displayName = displayName.split(' ')[0]
  }

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

  let yearsInIndustry: number | null = null
  if (profile.show_years_in_industry) {
    const row = await queryOne<{ get_public_profile_years_in_industry: number }>(
      'SELECT get_public_profile_years_in_industry($1)',
      [id],
    )
    if (row && typeof row.get_public_profile_years_in_industry === 'number') {
      yearsInIndustry = row.get_public_profile_years_in_industry
    }
  }

  const followEnabled = await isFeatureEnabled('social_follow')
  let followerCount = 0
  let followingCount = 0
  let followState: 'none' | 'pending' | 'active' | 'self' = 'none'

  if (followEnabled) {
    const [fcRow, gcRow, fsRow] = await Promise.all([
      queryOne<{ get_follower_count: number }>('SELECT get_follower_count($1)', [id]),
      queryOne<{ get_following_count: number }>('SELECT get_following_count($1)', [id]),
      queryOne<{ get_follow_state: string }>('SELECT get_follow_state($1)', [id]),
    ])
    if (fcRow && typeof fcRow.get_follower_count === 'number') followerCount = fcRow.get_follower_count
    if (gcRow && typeof gcRow.get_following_count === 'number') followingCount = gcRow.get_following_count
    if (fsRow && typeof fsRow.get_follow_state === 'string') {
      const fs = fsRow.get_follow_state
      if (fs === 'none' || fs === 'pending' || fs === 'active' || fs === 'self') {
        followState = fs
      }
    }
  }

  const avatarUrl = profile.avatar_path
    ? getPublicUrl('public-profile-avatars', profile.avatar_path)
    : null

  return (
    <div className="bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
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
                {displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold text-foreground">{displayName}</h1>
            <p className="text-xs text-muted-foreground/70 mt-0.5 font-mono">#{profile.public_id}</p>
            {profile.show_employment_status && profile.employment_type && (
              <p className="text-sm text-muted-foreground mt-2 capitalize">
                {profile.employment_type}
              </p>
            )}
            {followEnabled && (
              <div className="flex items-center gap-4 mt-3 text-sm">
                <Link href={`/profile/${profile.public_id}/followers`} className="hover:underline">
                  <span className="font-semibold text-foreground">{followerCount}</span>
                  <span className="text-muted-foreground"> {followerCount === 1 ? 'follower' : 'followers'}</span>
                </Link>
                <Link href={`/profile/${profile.public_id}/following`} className="hover:underline">
                  <span className="text-muted-foreground">Following </span>
                  <span className="font-semibold text-foreground">{followingCount}</span>
                </Link>
              </div>
            )}
          </div>
          {followEnabled && followState !== 'self' && (
            <ProfileActions targetPublicId={profile.public_id} initialFollowState={followState} />
          )}
        </div>

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

        {profile.show_years_in_industry && yearsInIndustry !== null && (
          <section className="mb-6">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{yearsInIndustry}</span> {yearsInIndustry === 1 ? 'year' : 'years'} in industry
            </p>
          </section>
        )}

        {typeRatings.length === 0 &&
         (!profile.aml_categories || profile.aml_categories.length === 0) && (
          <p className="text-sm text-muted-foreground">
            This profile has not yet added any licence credentials.
          </p>
        )}

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
