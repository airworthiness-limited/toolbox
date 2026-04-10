export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { queryAll } from '@/lib/db'
import { getPublicUrl } from '@/lib/storage'
import { isFeatureEnabledForUser } from '@/lib/feature-flags'
import { SidebarTriggerInline } from '@/components/sidebar-trigger-inline'
import { Rss } from 'lucide-react'
import { FeedList } from './feed-list'

export const metadata: Metadata = { title: 'Social Feed | Airworthiness' }

interface FeedPost {
  id: string
  author_id: string
  post_type: string
  data: Record<string, unknown>
  created_at: string
  author_public_id: string
  author_display_name: string
  author_avatar_path: string | null
}

export default async function FeedPage() {
  const session = await auth()
  const user = session?.user
  if (!user) redirect('/')

  const feedEnabled = await isFeatureEnabledForUser('social_feed', user.id)

  return (
    <div>
      <div className="mb-8 flex items-center gap-2">
        <SidebarTriggerInline />
        <h1 className="text-2xl font-semibold text-foreground">Social Feed</h1>
      </div>

      {feedEnabled ? <FeedContent userId={user.id!} /> : <ComingSoon />}
    </div>
  )
}

async function FeedContent({ userId }: { userId: string }) {
  const PAGE_SIZE = 25
  const posts = await queryAll<FeedPost>(
    'SELECT * FROM get_feed($1, $2)',
    [PAGE_SIZE, null]
  )
  const list: FeedPost[] = posts ?? []

  if (list.length === 0) {
    return (
      <div className="rounded-xl border border-border p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Rss className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <h2 className="text-lg font-semibold text-foreground">No posts yet</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Follow other engineers from their profile pages, or share your own milestones from the Module Tracker
          and Continuation Training pages, to see them appear here.
        </p>
      </div>
    )
  }

  // Resolve avatar URLs and photo URLs (for task_share posts)
  const postsWithMedia = list.map(post => {
    const avatarUrl = post.author_avatar_path
      ? getPublicUrl('public-profile-avatars', post.author_avatar_path)
      : null

    let photoUrls: string[] = []
    if (post.post_type === 'task_share') {
      const photos = (post.data as { photos?: unknown }).photos
      if (Array.isArray(photos)) {
        photoUrls = photos
          .filter((p): p is string => typeof p === 'string')
          .map(path => getPublicUrl('post-photos', path))
      }
    }

    return { post, avatarUrl, photoUrls }
  })

  return (
    <FeedList
      initial={postsWithMedia}
      initialHasMore={list.length === PAGE_SIZE}
      currentUserId={userId}
    />
  )
}

function ComingSoon() {
  return (
    <div className="rounded-xl border border-border p-12 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
        <Rss className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h2 className="text-lg font-semibold text-foreground">Coming soon</h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
        A professional feed for UK Aircraft Maintenance Licence holders. Share milestones,
        celebrate type ratings, and stay in touch with the small industry. Engineer-to-engineer,
        no operator data, no fluff.
      </p>
    </div>
  )
}
