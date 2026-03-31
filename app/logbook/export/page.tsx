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

  const fullName = profile?.full_name ?? 'Unknown'
  const userId = user.id
  const generatedDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      <style>{`
        @page { size: 297mm 210mm; margin: 10mm 10mm 20mm 10mm; }
        @media print {
          .print-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            border-top: 1px solid #d1d5db;
            padding: 4px 10mm;
            font-size: 8px;
            color: #6b7280;
            background: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
        }
        @media screen {
          .print-footer { display: none; }
        }
      `}</style>

      {/* Fixed footer — repeats on every printed page */}
      <div className="print-footer">
        <span>Digitally signed by {fullName} &nbsp;|&nbsp; ID: {userId}</span>
        <span>Airworthiness Limited Digital Logbook &nbsp;|&nbsp; Generated {generatedDate}</span>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 print:px-2 print:py-4">
        {/* Header */}
        <div className="mb-8 print:mb-4">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900 print:text-xl">
              Digital Logbook (CAP 741)
            </h1>
            <div className="print:hidden">
              <PrintButton />
            </div>
          </div>
          <p className="text-xs text-amber-600 font-medium print:hidden mb-4">
            ⚠ In the print dialog, set Paper Orientation to <strong>Landscape</strong> before saving.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 print:gap-2 print:mt-2">
            <div>
              <p className="text-xs text-gray-400 uppercase">Name</p>
              <p className="font-medium text-gray-900">{fullName}</p>
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
            <div>
              <p className="text-xs text-gray-400 uppercase">Logbook ID</p>
              <p className="font-medium text-gray-900 text-xs break-all">{userId}</p>
            </div>
          </div>
        </div>

        <ExportTable entries={entries ?? []} />

        {/* Screen-only footer */}
        <div className="mt-8 pt-4 border-t text-xs text-gray-400 print:hidden">
          <p>Generated {generatedDate}, Airworthiness Limited Digital Logbook</p>
        </div>
      </div>
    </>
  )
}
