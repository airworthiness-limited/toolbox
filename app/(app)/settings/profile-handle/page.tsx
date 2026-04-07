import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isFeatureEnabled } from '@/lib/feature-flags'
import { HandleForm } from './handle-form'
import { SidebarTriggerInline } from '@/components/sidebar-trigger-inline'

export const metadata: Metadata = { title: 'Choose your handle | Airworthiness' }

export default async function ProfileHandlePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (!(await isFeatureEnabled('social_profile'))) {
    redirect('/settings')
  }

  const { data: profile } = await supabase
    .from('public_profiles')
    .select('handle, is_public, avatar_path')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile) {
    // No public profile yet — back to settings to opt in first
    redirect('/settings')
  }

  const avatarUrl = profile.avatar_path
    ? supabase.storage.from('public-profile-avatars').getPublicUrl(profile.avatar_path).data.publicUrl
    : null

  return (
    <div>
      <div className="mb-8 flex items-center gap-2">
        <SidebarTriggerInline />
        <h1 className="text-2xl font-semibold text-foreground">Profile settings</h1>
      </div>
      <div className="max-w-lg space-y-6">
        <HandleForm currentHandle={profile.handle} initialAvatarUrl={avatarUrl} />
      </div>
    </div>
  )
}
