import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogbookEntryForm } from './logbook-entry-form'

export default async function NewLogbookEntryPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch user's employers for the employer dropdown
  const { data: periods } = await supabase
    .from('employment_periods')
    .select('employer')
    .eq('user_id', user.id)
    .order('start_date', { ascending: false })

  const employers = [...new Set(periods?.map(p => p.employer) ?? [])]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">New Logbook Entry</h1>
        <p className="text-gray-500 mb-8">
          Record a maintenance task. You can save as draft and submit for verification later.
        </p>

        <LogbookEntryForm employers={employers} />
      </div>
    </div>
  )
}
