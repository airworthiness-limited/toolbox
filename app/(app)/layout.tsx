export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { queryOne } from '@/lib/db'
import { AppSidebar } from '@/components/app-sidebar'
import { QuickAdd } from '@/components/quick-add'
import { PrivacyPolicyBanner } from '@/components/privacy-policy-banner'
import { isFeatureEnabled } from '@/lib/feature-flags'
import { CURRENT_PRIVACY_POLICY_VERSION } from '@/lib/privacy-policy'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const user = session?.user

  if (!user) redirect('/')

  const profile = await queryOne<{ profile_completed_at: string | null }>(
    'SELECT profile_completed_at FROM profiles WHERE id = $1',
    [user.id]
  )

  if (!profile?.profile_completed_at) redirect('/complete-profile')

  const quickAddEnabled = await isFeatureEnabled('quick_add')

  // Privacy policy acknowledgement check — show banner if user has not
  // acknowledged the current version
  const ack = await queryOne<{ version: string }>(
    'SELECT version FROM privacy_policy_acknowledgements WHERE user_id = $1',
    [user.id]
  )
  const needsPolicyAck = ack?.version !== CURRENT_PRIVACY_POLICY_VERSION

  return (
    <>
      <AppSidebar />
      <main className="md:ml-60 min-h-screen bg-background relative">
        <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6 pb-24 animate-fade-in">
          {children}
        </div>
      </main>
      {quickAddEnabled && <QuickAdd />}
      {needsPolicyAck && <PrivacyPolicyBanner version={CURRENT_PRIVACY_POLICY_VERSION} />}
    </>
  )
}
