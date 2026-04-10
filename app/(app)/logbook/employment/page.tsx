export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { queryAll } from '@/lib/db'
import { EmploymentForm } from './employment-form'
import type { EmploymentPeriod } from '@/lib/logbook/types'
import { SidebarTriggerInline } from '@/components/sidebar-trigger-inline'

export default async function EmploymentPage() {
  const session = await auth()
  const user = session?.user
  if (!user) redirect('/login')

  const periods = await queryAll<EmploymentPeriod>(
    'SELECT * FROM employment_periods WHERE user_id = $1 ORDER BY start_date DESC',
    [user.id]
  )

  return (
    <div className="min-h-screen aw-gradient">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-6">
          <SidebarTriggerInline />
        </div>
        <h1 className="text-2xl font-semibold text-white mb-2">Employment History</h1>
        <p className="text-white/60 mb-8">
          Add your employers and dates. This is used to match you with verifiers who worked at the same organisation during the same period.
        </p>

        <EmploymentForm periods={periods ?? []} userId={user.id!} />
      </div>
    </div>
  )
}
