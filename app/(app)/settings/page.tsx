export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { queryOne, queryAll } from '@/lib/db'
import { SettingsPanel } from './settings-panel'
import { SidebarTriggerInline } from '@/components/sidebar-trigger-inline'
import { isFeatureEnabledForUser } from '@/lib/feature-flags'

interface PendingRequest { follower_id: string }

export const metadata: Metadata = { title: 'Settings | Airworthiness' }

export default async function SettingsPage() {
  const session = await auth()
  const user = session?.user
  if (!user) redirect('/login')

  const socialProfileEnabled = await isFeatureEnabledForUser('social_profile', user.id)
  const socialFollowEnabled = await isFeatureEnabledForUser('social_follow', user.id)

  // Load the user's public profile row if it exists. May be null if they
  // have never opted in. Loaded server-side so the panel can render the
  // correct state on first paint.
  const publicProfile = await queryOne<{ public_id: string; is_public: boolean }>(
    'SELECT public_id, is_public FROM public_profiles WHERE user_id = $1',
    [user.id]
  )

  // Pending follow request count (Phase 2)
  let pendingFollowRequests = 0
  if (socialFollowEnabled) {
    const pending = await queryAll<PendingRequest>(
      'SELECT * FROM get_pending_follow_requests()'
    )
    pendingFollowRequests = (pending ?? []).length
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <SidebarTriggerInline />
          <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        </div>
      </div>
      <SettingsPanel
        userEmail={user.email ?? ''}
        socialProfileEnabled={socialProfileEnabled}
        socialFollowEnabled={socialFollowEnabled}
        pendingFollowRequests={pendingFollowRequests}
        publicProfile={publicProfile}
      />
    </div>
  )
}
