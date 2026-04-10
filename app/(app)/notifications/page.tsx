export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { queryAll } from '@/lib/db'
import { getPublicUrl } from '@/lib/storage'
import { SidebarTriggerInline } from '@/components/sidebar-trigger-inline'
import { Bell } from 'lucide-react'
import { MarkAllRead } from './mark-all-read'

export const metadata: Metadata = { title: 'Notifications | Airworthiness' }

interface Notification {
  id: string
  notification_type: string
  data: Record<string, unknown>
  is_read: boolean
  created_at: string
  actor_id: string | null
  actor_public_id: string | null
  actor_display_name: string | null
  actor_avatar_path: string | null
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function notificationText(notif: Notification): string {
  const name = notif.actor_display_name ?? 'Someone'
  switch (notif.notification_type) {
    case 'new_follower':
      return `${name} started following you`
    case 'follow_requested':
      return `${name} requested to follow you`
    case 'follow_accepted':
      return `${name} accepted your follow request`
    default:
      return `${name} did something`
  }
}

export default async function NotificationsPage() {
  const session = await auth()
  const user = session?.user
  if (!user) redirect('/')

  const notifications = await queryAll<Notification>(
    'SELECT * FROM get_notifications($1)',
    [100]
  )
  const list: Notification[] = notifications ?? []

  const hasUnread = list.some(n => !n.is_read)

  return (
    <div>
      <div className="mb-8 flex items-center gap-2">
        <SidebarTriggerInline />
        <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
      </div>

      {hasUnread && <MarkAllRead />}

      {list.length === 0 ? (
        <div className="rounded-xl border border-border p-12 text-center max-w-2xl">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Bell className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No notifications yet</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            When other engineers follow you or accept your follow requests, you&apos;ll see them here.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-w-2xl">
          {list.map(notif => {
            const avatarUrl = notif.actor_avatar_path
              ? getPublicUrl('public-profile-avatars', notif.actor_avatar_path)
              : null
            const linkHref = notif.actor_public_id ? `/profile/${notif.actor_public_id}` : '#'
            return (
              <Link
                key={notif.id}
                href={linkHref}
                className={`rounded-xl border border-border p-4 flex items-center gap-3 hover:border-foreground/40 transition-colors ${
                  notif.is_read ? '' : 'bg-muted/30'
                }`}
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-border/60" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted border border-border/60 flex items-center justify-center text-xs font-semibold text-muted-foreground">
                    {(notif.actor_display_name ?? 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{notificationText(notif)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{relativeTime(notif.created_at)}</p>
                </div>
                {!notif.is_read && (
                  <div className="w-2 h-2 rounded-full bg-foreground flex-shrink-0" aria-label="Unread" />
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
