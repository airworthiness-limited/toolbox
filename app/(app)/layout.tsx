import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from '@/components/app-sidebar'

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
      <main className="min-h-screen bg-background transition-all duration-200 md:ml-[var(--sidebar-width,15rem)]">
        {/* Mobile top padding for the mobile header */}
        <div className="md:hidden h-12" />
        <div className="max-w-4xl mx-auto px-6 pt-4 pb-8">
          {children}
        </div>
      </main>
    </>
  )
}
