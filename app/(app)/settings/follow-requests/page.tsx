import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isFeatureEnabledForUser } from '@/lib/feature-flags'
import { SidebarTriggerInline } from '@/components/sidebar-trigger-inline'
import { FollowRequestActions } from './follow-request-actions'

export const metadata: Metadata = { title: 'Follow requests | Airworthiness' }

interface PendingRequest {
  follower_id: string
  handle: string
  display_name: string
  avatar_path: string | null
  requested_at: string
}

export default async function FollowRequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  if (!(await isFeatureEnabledForUser('social_follow', user.id))) {
    redirect('/settings')
  }

  const { data: requests } = await supabase.rpc('get_pending_follow_requests')
  const pending: PendingRequest[] = (requests as PendingRequest[]) ?? []

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
                ? supabase.storage.from('public-profile-avatars').getPublicUrl(req.avatar_path).data.publicUrl
                : null
              return (
                <div key={req.follower_id} className="rounded-xl border border-border p-4 flex items-center gap-4">
                  <Link href={`/u/${req.handle}`} className="flex items-center gap-3 flex-1 min-w-0">
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
                      <p className="text-xs text-muted-foreground truncate">@{req.handle}</p>
                    </div>
                  </Link>
                  <FollowRequestActions followerHandle={req.handle} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
