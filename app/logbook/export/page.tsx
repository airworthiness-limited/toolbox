import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PrintButton } from './print-button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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
    .select('id, task_date, aircraft_type, aircraft_registration, job_number, description, ata_chapter, maintenance_type')
    .eq('user_id', user.id)
    .order('task_date', { ascending: true })

  const allEntries = entries ?? []

  return (
    <>
      <div className="print:hidden flex justify-end max-w-7xl mx-auto px-6 pt-6 gap-3">
        <PrintButton />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 print:px-2 print:py-4">
        {/* Header */}
        <div className="mb-8 print:mb-4">
          <h1 className="text-2xl font-bold text-gray-900 print:text-xl">
            Digital Logbook (CAP 741)
          </h1>

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
              <p className="text-xs text-gray-400 uppercase">Entries</p>
              <p className="font-medium text-gray-900">{allEntries.length}</p>
            </div>
          </div>
        </div>

        {allEntries.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No entries to export.</p>
        ) : (
          <div className="border rounded-lg overflow-hidden print:border-black">
            <Table>
              <TableHeader>
                <TableRow className="print:text-xs">
                  <TableHead className="print:px-1 whitespace-nowrap">Date</TableHead>
                  <TableHead className="print:px-1 whitespace-nowrap">Facility</TableHead>
                  <TableHead className="print:px-1 whitespace-nowrap">Aircraft Type</TableHead>
                  <TableHead className="print:px-1 whitespace-nowrap">Aircraft Registration</TableHead>
                  <TableHead className="print:px-1 whitespace-nowrap">Job Number</TableHead>
                  <TableHead className="print:px-1 whitespace-nowrap">ATA Group</TableHead>
                  <TableHead className="print:px-1">Task Detail</TableHead>
                  <TableHead className="print:px-1 whitespace-nowrap w-32">Supervisor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allEntries.map(entry => (
                  <TableRow key={entry.id} className="print:text-xs">
                    <TableCell className="whitespace-nowrap print:px-1">
                      {new Date(entry.task_date).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="print:px-1 whitespace-nowrap">
                      {entry.maintenance_type === 'base_maintenance' ? 'Base Maintenance' : 'Line Maintenance'}
                    </TableCell>
                    <TableCell className="print:px-1">{entry.aircraft_type}</TableCell>
                    <TableCell className="print:px-1">{entry.aircraft_registration}</TableCell>
                    <TableCell className="print:px-1">{entry.job_number ?? '-'}</TableCell>
                    <TableCell className="print:px-1">{entry.ata_chapter ?? '-'}</TableCell>
                    <TableCell className="print:px-1">{entry.description}</TableCell>
                    <TableCell className="print:px-1 border-l border-gray-200 print:border-black" />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-xs text-gray-400 print:mt-4">
          <p>Generated {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}, Airworthiness Limited Digital Logbook</p>
        </div>
      </div>
    </>
  )
}
