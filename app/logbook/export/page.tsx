import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PrintButton } from './print-button'
import { ExportTable } from './export-table'

export default async function ExportPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, aml_licence_number')
    .eq('id', user.id)
    .single()

  const { data: entries } = await supabase
    .from('logbook_entries')
    .select('id, task_date, aircraft_type, aircraft_registration, job_number, description, ata_chapter, maintenance_type, aircraft_category')
    .eq('user_id', user.id)
    .order('task_date', { ascending: true })

  return (
    <>
      <style>{`@media print { @page { size: landscape; } }`}</style>
      <div className="max-w-7xl mx-auto px-6 py-8 print:px-2 print:py-4">
        {/* Header */}
        <div className="mb-8 print:mb-4">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-2xl font-bold text-gray-900 print:text-xl">
              Digital Logbook (CAP 741)
            </h1>
            <div className="print:hidden">
              <PrintButton />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 print:gap-2 print:mt-2">
            <div>
              <p className="text-xs text-gray-400 uppercase">Name</p>
              <p className="font-medium text-gray-900">{profile?.full_name ?? 'Unknown'}</p>
            </div>
            {profile?.aml_licence_number && (
              <div>
                <p className="text-xs text-gray-400 uppercase">AML Number</p>
                <p className="font-medium text-gray-900">{profile.aml_licence_number}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400 uppercase">Total Entries</p>
              <p className="font-medium text-gray-900">{(entries ?? []).length}</p>
            </div>
          </div>
        </div>

        <ExportTable entries={entries ?? []} />

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-xs text-gray-400 print:mt-4">
          <p>Generated {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}, Airworthiness Limited Digital Logbook</p>
        </div>
      </div>
    </>
  )
}
