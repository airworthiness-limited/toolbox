export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { queryAll } from '@/lib/db'
import { getPublicUrl } from '@/lib/storage'
import { isFeatureEnabled } from '@/lib/feature-flags'
import { FollowList } from '../follow-list'

interface PageProps {
  params: Promise<{ id: string }>
}

const PUBLIC_ID_REGEX = /^[0-9]{8}$/

interface Entry {
  user_id: string
  public_id: string
  display_name: string
  avatar_path: string | null
  followed_since: string
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: `Following | Airworthiness`, robots: { index: false, follow: false } }
}

export default async function FollowingPage({ params }: PageProps) {
  const { id } = await params
  if (!PUBLIC_ID_REGEX.test(id)) notFound()
  if (!(await isFeatureEnabled('social_profile'))) notFound()
  if (!(await isFeatureEnabled('social_follow'))) notFound()

  const rows = await queryAll('SELECT * FROM get_public_profile($1)', [id])
  const profile = rows?.[0]
  if (!profile) notFound()

  const following = await queryAll<Entry>('SELECT * FROM get_following($1, $2)', [id, 200])
  const list: Entry[] = following ?? []

  function avatarUrlFor(path: string | null): string | null {
    if (!path) return null
    return getPublicUrl('public-profile-avatars', path)
  }

  const displayName = profile.display_name || profile.full_name || 'Engineer'

  return (
    <div className="bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href={`/profile/${id}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to {displayName}
        </Link>
        <h1 className="text-2xl font-semibold text-foreground mt-3 mb-6">
          Following <span className="text-muted-foreground font-normal">· {list.length}</span>
        </h1>
        <FollowList
          entries={list}
          avatarUrlFor={avatarUrlFor}
          emptyMessage={`${displayName} isn't following anyone yet.`}
        />
      </div>
    </div>
  )
}
