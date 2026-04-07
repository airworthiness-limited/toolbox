import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isFeatureEnabledForUser } from '@/lib/feature-flags'
import { SidebarTriggerInline } from '@/components/sidebar-trigger-inline'
import { Rss } from 'lucide-react'

export const metadata: Metadata = { title: 'Social Feed | Airworthiness' }

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const feedEnabled = await isFeatureEnabledForUser('social_feed', user.id)

  return (
    <div>
      <div className="mb-8 flex items-center gap-2">
        <SidebarTriggerInline />
        <h1 className="text-2xl font-semibold text-foreground">Social Feed</h1>
      </div>

      {feedEnabled ? (
        <div className="rounded-xl border border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            The social feed will appear here once posts have been shared.
          </p>
        </div>
      ) : (
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
      )}
    </div>
  )
}
