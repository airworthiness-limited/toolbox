export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { queryOne } from '@/lib/db'
import { CompleteProfileForm } from './complete-profile-form'

export default async function CompleteProfilePage() {
  const session = await auth()
  const user = session?.user

  if (!user) redirect('/')

  const profile = await queryOne<{ profile_completed_at: string | null }>(
    'SELECT profile_completed_at FROM profiles WHERE id = $1',
    [user.id],
  )

  if (profile?.profile_completed_at) {
    redirect('/dashboard')
  }

  return <CompleteProfileForm userId={user.id!} />
}
