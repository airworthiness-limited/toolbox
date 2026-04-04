import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarTriggerInline } from '@/components/sidebar-trigger-inline'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/signup')

  const { data: profile } = await supabase
    .from('profiles')
    .select('profile_completed_at')
    .eq('id', user.id)
    .single()

  if (!profile?.profile_completed_at) redirect('/complete-profile')

  return (
    <>
      <AppSidebar />
      <main className="md:ml-60 min-h-screen bg-background relative">
        <div className="max-w-4xl mx-auto pl-12 pr-6 md:px-6 pt-6 pb-8">
          <SidebarTriggerInline />
          {children}
        </div>
      </main>
    </>
  )
}
