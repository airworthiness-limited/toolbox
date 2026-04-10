export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { queryAll } from '@/lib/db'
import { getPublicUrl } from '@/lib/storage'
import { SidebarTriggerInline } from '@/components/sidebar-trigger-inline'
import { UnblockButton } from './unblock-button'

export const metadata: Metadata = { title: 'Blocked users | Airworthiness' }

interface BlockedUser {
  user_id: string
  public_id: string | null
  display_name: string | null
  avatar_path: string | null
  blocked_at: string
}

export default async function BlockedUsersPage() {
  const session = await auth()
  const user = session?.user
  if (!user) redirect('/')

  const blocked = await queryAll<BlockedUser>(
    'SELECT * FROM get_blocked_users()'
  )
  const list: BlockedUser[] = blocked ?? []

  return (
    <div>
      <div className="mb-8 flex items-center gap-2">
        <SidebarTriggerInline />
        <h1 className="text-2xl font-semibold text-foreground">Blocked users</h1>
      </div>

      <div className="max-w-2xl">
        <p className="text-sm text-muted-foreground mb-4">
          When you block someone, you won&apos;t see each other&apos;s profiles or posts. They are not notified.
        </p>

        {list.length === 0 ? (
          <div className="rounded-xl border border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">You haven&apos;t blocked anyone.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {list.map(b => {
              const avatarUrl = b.avatar_path
                ? getPublicUrl('public-profile-avatars', b.avatar_path)
                : null
              return (
                <div key={b.user_id} className="rounded-xl border border-border p-4 flex items-center gap-3">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-border/60" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted border border-border/60 flex items-center justify-center text-xs font-semibold text-muted-foreground">
                      {(b.display_name ?? 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{b.display_name ?? 'Unknown user'}</p>
                  </div>
                  {b.public_id && <UnblockButton publicId={b.public_id} />}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
