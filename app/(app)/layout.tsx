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
      <main className="md:ml-60 min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 pt-6 pb-8">
          {children}
        </div>
      </main>
    </>
  )
}
