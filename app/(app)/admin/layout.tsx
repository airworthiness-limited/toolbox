export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/feature-flags'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const user = session?.user

  if (!user) redirect('/')

  const admin = await isAdmin(user.id)
  if (!admin) redirect('/dashboard')

  return <>{children}</>
}
