import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PrintButton } from './print-button'
import { ExportTable } from './export-table'
import {
  RECENCY_TASK_THRESHOLD,
  RECENCY_DAY_THRESHOLD,
  EXPERIENCE_VALIDITY_YEARS,
} from '@/lib/logbook/constants'

function calcMonths(periods: { start_date: string; end_date: string | null }[], cutoff: Date): number {
  let totalDays = 0
  for (const p of periods) {
    const start = new Date(p.start_date) < cutoff ? cutoff : new Date(p.start_date)
    const end = p.end_date ? new Date(p.end_date) : new Date()
    if (end <= start) continue
    totalDays += Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }
  return Math.round(totalDays / 30.44)
}

export default async function ExportPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const twoYearsAgo = new Date(now)
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
  const twoYearsAgoStr = twoYearsAgo.toISOString().split('T')[0]
  const tenYearsAgo = new Date(now)
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - EXPERIENCE_VALIDITY_YEARS)

  const [{ data: profile }, { data: entries }, { data: recencyEntries }, { data: employmentPeriods }] = await Promise.all([
    supabase.from('profiles').select('full_name, aml_licence_number').eq('id', user.id).single(),
    supabase
      .from('logbook_entries')
      .select('id, task_date, aircraft_type, aircraft_registration, job_number, description, ata_chapter, maintenance_type, aircraft_category, work_order_photo_path')
      .eq('user_id', user.id)
      .order('task_date', { ascending: true }),
    supabase
      .from('logbook_entries')
      .select('task_date')
      .eq('user_id', user.id)
      .gte('task_date', twoYearsAgoStr),
    supabase
      .from('employment_periods')
      .select('start_date, end_date, is_military')
      .eq('user_id', user.id),
  ])

  const fullName = profile?.full_name ?? 'Unknown'
  const userId = user.id
  const generatedDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const recencyTasks = (recencyEntries ?? []).length
  const recencyDays = new Set((recencyEntries ?? []).map(e => e.task_date)).size

  const allPeriods = employmentPeriods ?? []
  const civilMonths = calcMonths(allPeriods.filter(p => !p.is_military), tenYearsAgo)
  const militaryMonths = calcMonths(allPeriods.filter(p => p.is_military), tenYearsAgo)
  const cappedMilitaryMonths = Math.min(militaryMonths, 48)
  const totalCombinedMonths = civilMonths + cappedMilitaryMonths
  const expYears = Math.floor(totalCombinedMonths / 12)
  const expMonths = totalCombinedMonths % 12

  return (
    <>
      <style>{`
        @page { size: A4 landscape; margin: 10mm 10mm 20mm 10mm; }
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
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-2xl font-bold text-gray-900 print:text-xl">
              Digital Logbook (CAP 741)
            </h1>
            <div className="print:hidden">
              <PrintButton />
            </div>
          </div>

          {/* Uniform stat row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 print:grid-cols-8 print:gap-2">
            {[
              { label: 'Name', value: fullName },
              ...(profile?.aml_licence_number ? [{ label: 'AML No.', value: profile.aml_licence_number }] : []),
              { label: 'Total Entries', value: String((entries ?? []).length) },
              { label: 'Recency Tasks (2yr)', value: `${recencyTasks} / ${RECENCY_TASK_THRESHOLD}` },
              { label: 'Recency Days (2yr)', value: `${recencyDays} / ${RECENCY_DAY_THRESHOLD}` },
              { label: 'Experience', value: `${expYears}y ${expMonths}m` },
            ].map(({ label, value }) => (
              <div key={label} className="border border-gray-200 rounded-lg px-3 py-2 print:px-2 print:py-1">
                <p className="text-xs text-gray-400 uppercase tracking-wider leading-none mb-1">{label}</p>
                <p className="text-sm font-semibold text-gray-900">{value}</p>
              </div>
            ))}
            <div className="border border-gray-200 rounded-lg px-3 py-2 print:px-2 print:py-1 col-span-2 sm:col-span-2">
              <p className="text-xs text-gray-400 uppercase tracking-wider leading-none mb-1">Logbook ID</p>
              <p className="text-sm font-semibold text-gray-900 font-mono break-all">{userId}</p>
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
