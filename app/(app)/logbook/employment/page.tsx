import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EmploymentForm } from './employment-form'

export default async function EmploymentPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: periods } = await supabase
    .from('employment_periods')
    .select('*')
    .eq('user_id', user.id)
    .order('start_date', { ascending: false })

  return (
    <div className="min-h-screen aw-gradient">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-white mb-2">Employment History</h1>
        <p className="text-white/60 mb-8">
          Add your employers and dates. This is used to match you with verifiers who worked at the same organisation during the same period.
        </p>

        <EmploymentForm periods={periods ?? []} />
      </div>
    </div>
  )
}
