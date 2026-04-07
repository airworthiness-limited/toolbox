import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsPanel } from './settings-panel'
import { SidebarTriggerInline } from '@/components/sidebar-trigger-inline'
import { isFeatureEnabledForUser } from '@/lib/feature-flags'

interface PendingRequest { follower_id: string }

export const metadata: Metadata = { title: 'Settings | Airworthiness' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const socialProfileEnabled = await isFeatureEnabledForUser('social_profile', user.id)
  const socialFollowEnabled = await isFeatureEnabledForUser('social_follow', user.id)

  // Load the user's public profile row if it exists. May be null if they
  // have never opted in. Loaded server-side so the panel can render the
  // correct state on first paint.
  const { data: publicProfile } = await supabase
    .from('public_profiles')
    .select('handle, is_public')
    .eq('user_id', user.id)
    .maybeSingle()

  // Pending follow request count (Phase 2)
  let pendingFollowRequests = 0
  if (socialFollowEnabled) {
    const { data: pending } = await supabase.rpc('get_pending_follow_requests')
    pendingFollowRequests = ((pending as PendingRequest[]) ?? []).length
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
