export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { queryAll } from '@/lib/db'
import { getPublicUrl } from '@/lib/storage'
import { isFeatureEnabledForUser } from '@/lib/feature-flags'
import { SidebarTriggerInline } from '@/components/sidebar-trigger-inline'
import { FollowRequestActions } from './follow-request-actions'

export const metadata: Metadata = { title: 'Follow requests | Airworthiness' }

interface PendingRequest {
  follower_id: string
  public_id: string
  display_name: string
  avatar_path: string | null
  requested_at: string
}

export default async function FollowRequestsPage() {
  const session = await auth()
  const user = session?.user
  if (!user) redirect('/')

  if (!(await isFeatureEnabledForUser('social_follow', user.id))) {
    redirect('/settings')
  }

  const requests = await queryAll<PendingRequest>(
    'SELECT * FROM get_pending_follow_requests()'
  )
  const pending: PendingRequest[] = requests ?? []

  return (
    <div>
      <div className="mb-8 flex items-center gap-2">
        <SidebarTriggerInline />
        <h1 className="text-2xl font-semibold text-foreground">Follow requests</h1>
      </div>

      <div className="max-w-lg">
        {pending.length === 0 ? (
          <div className="rounded-xl border border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No pending follow requests.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map(req => {
              const avatarUrl = req.avatar_path
                ? getPublicUrl('public-profile-avatars', req.avatar_path)
                : null
              return (
                <div key={req.follower_id} className="rounded-xl border border-border p-4 flex items-center gap-4">
                  <Link href={`/profile/${req.public_id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-border/60" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted border border-border/60 flex items-center justify-center text-xs font-semibold text-muted-foreground">
                        {req.display_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{req.display_name}</p>
                    </div>
                  </Link>
                  <FollowRequestActions followerPublicId={req.public_id} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
