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
import { ATA_CHAPTERS, MAINTENANCE_CATEGORIES, AIRCRAFT_CATEGORIES } from '@/lib/logbook/constants'

function label(list: readonly { value: string; label: string }[], value: string) {
  return list.find(i => i.value === value)?.label ?? value
}

export default async function ExportPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, aml_licence_number')
    .eq('id', user.id)
    .single()

  // Fetch all verified/qc_approved entries with verifier info
  const { data: entries } = await supabase
    .from('logbook_entries')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['verified', 'qc_approved', 'pending_qc'])
    .order('task_date', { ascending: true })

  const allEntries = entries ?? []

  // Fetch verifier profiles for all entries
  const verifierIds = [...new Set(allEntries.map(e => e.verifier_id).filter(Boolean))]
  let verifierMap: Record<string, { full_name: string; aml_licence_number: string }> = {}
  if (verifierIds.length > 0) {
    const { data: verifiers } = await supabase
      .from('profiles')
      .select('id, full_name, aml_licence_number')
      .in('id', verifierIds)
    verifiers?.forEach(v => {
      verifierMap[v.id] = { full_name: v.full_name, aml_licence_number: v.aml_licence_number }
    })
  }

  const totalHours = allEntries.reduce((sum, e) => sum + Number(e.duration_hours), 0)
  const dateRange = allEntries.length > 0
    ? `${new Date(allEntries[0].task_date).toLocaleDateString('en-GB')} to ${new Date(allEntries[allEntries.length - 1].task_date).toLocaleDateString('en-GB')}`
    : 'N/A'

  return (
    <>
      <div className="print:hidden flex justify-end max-w-7xl mx-auto px-6 pt-6 gap-3">
        <PrintButton />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 print:px-2 print:py-4">
        {/* Header */}
        <div className="mb-8 print:mb-4">
          <h1 className="text-2xl font-bold text-gray-900 print:text-xl">
            Aircraft Maintenance Task Logbook
          </h1>
          <p className="text-sm text-gray-500 mt-1">Aircraft Maintenance Digital Logbook</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 print:gap-2 print:mt-2">
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
              <p className="text-xs text-gray-400 uppercase">Period</p>
              <p className="font-medium text-gray-900">{dateRange}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">Total Hours</p>
              <p className="font-medium text-gray-900">{totalHours.toFixed(1)}</p>
            </div>
          </div>
        </div>

        {allEntries.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No verified entries to export.</p>
        ) : (
          <div className="border rounded-lg overflow-hidden print:border-black">
            <Table>
              <TableHeader>
                <TableRow className="print:text-xs">
                  <TableHead className="print:px-1">Date</TableHead>
                  <TableHead className="print:px-1">Aircraft Type</TableHead>
                  <TableHead className="print:px-1">Reg.</TableHead>
                  <TableHead className="print:px-1">ATA</TableHead>
                  <TableHead className="print:px-1">Description</TableHead>
                  <TableHead className="print:px-1">Category</TableHead>
                  <TableHead className="print:px-1">Hrs</TableHead>
                  <TableHead className="print:px-1">Sup.</TableHead>
                  <TableHead className="print:px-1">Job No.</TableHead>
                  <TableHead className="print:px-1">Verifier</TableHead>
                  <TableHead className="print:px-1">AML No.</TableHead>
                  <TableHead className="print:px-1">Verified</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allEntries.map(entry => {
                  const verifier = entry.verifier_id ? verifierMap[entry.verifier_id] : null
                  return (
                    <TableRow key={entry.id} className="print:text-xs">
                      <TableCell className="whitespace-nowrap print:px-1">
                        {new Date(entry.task_date).toLocaleDateString('en-GB')}
                      </TableCell>
                      <TableCell className="print:px-1">{entry.aircraft_type}</TableCell>
                      <TableCell className="print:px-1">{entry.aircraft_registration}</TableCell>
                      <TableCell className="print:px-1">{entry.ata_chapter}</TableCell>
                      <TableCell className="print:px-1 max-w-[200px] truncate">{entry.description}</TableCell>
                      <TableCell className="print:px-1 whitespace-nowrap">
                        {label(MAINTENANCE_CATEGORIES, entry.category)}
                      </TableCell>
                      <TableCell className="print:px-1">{Number(entry.duration_hours).toFixed(1)}</TableCell>
                      <TableCell className="print:px-1">{entry.supervised ? 'Y' : 'N'}</TableCell>
                      <TableCell className="print:px-1">{entry.job_number ?? '-'}</TableCell>
                      <TableCell className="print:px-1">{verifier?.full_name ?? '-'}</TableCell>
                      <TableCell className="print:px-1">{verifier?.aml_licence_number ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap print:px-1">
                        {entry.verified_at ? new Date(entry.verified_at).toLocaleDateString('en-GB') : '-'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-xs text-gray-400 print:mt-4">
          <p>Generated {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} , Airworthiness Limited Digital Logbook</p>
        </div>
      </div>
    </>
  )
}
