import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CompleteProfileForm } from './complete-profile-form'

export default async function CompleteProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('profile_completed_at')
    .eq('id', user.id)
    .single()

  if (profile?.profile_completed_at) {
    redirect('/dashboard')
  }

  return <CompleteProfileForm />
}
