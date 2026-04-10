export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { queryOne, queryAll } from '@/lib/db'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  MAINTENANCE_CATEGORIES,
  ATA_CHAPTERS,
} from '@/lib/logbook/constants'
import { SidebarTriggerInline } from '@/components/sidebar-trigger-inline'

const PAGE_SIZE = 25

function label(list: readonly { value: string; label: string }[], value: string) {
  return list.find(i => i.value === value)?.label ?? value
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const session = await auth()
  const user = session?.user
  if (!user) redirect('/login')

  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  // Verify the user is an AML holder
  const profile = await queryOne<{ aml_licence_number: string | null; aml_categories: string[] | null }>(
    'SELECT aml_licence_number, aml_categories FROM profiles WHERE id = $1',
    [user.id]
  )

  if (!profile?.aml_licence_number) {
    return (
      <div className="min-h-screen aw-gradient">
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="mb-6">
            <SidebarTriggerInline />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-4">Verification Queue</h1>
          <p className="text-white/60 mb-6">
            You need a Part 66 Aircraft Maintenance Licence to verify logbook entries.
          </p>
          <Link href="/account">
            <Button>Update your profile</Button>
          </Link>
        </div>
      </div>
    )
  }

  const verifierCategories = profile.aml_categories ?? []

  // Use the database function to filter server-side instead of fetching all entries
  const entries = await queryAll<any>(
    'SELECT * FROM get_verification_queue($1, $2, $3, $4)',
    [user.id, verifierCategories, PAGE_SIZE, offset]
  )

  const filteredEntries = entries ?? []
  const hasNextPage = filteredEntries.length === PAGE_SIZE

  return (
    <div className="min-h-screen aw-gradient">
      <div className="max-w-6xl mx-auto px-4 py-12">

        <div className="flex items-center gap-3 mb-6">
          <SidebarTriggerInline />
          <Link href="/logbook" className="text-sm text-foreground hover:underline">
            &larr; Back to logbook
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white">Verification Queue</h1>
          <p className="text-white/60 mt-1">
            Entries from personnel at your employer(s), matching your AML categories.
          </p>
        </div>

        <div className="bg-card rounded-xl border p-4 mb-6">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Your AML:</span> {profile.aml_licence_number}, Categories: {verifierCategories.join(', ') || 'None'}
          </p>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="bg-card rounded-xl border p-8 text-center text-muted-foreground">
            <p>No entries pending your verification.</p>
            <p className="text-sm mt-1">Entries will appear here when personnel at your employer submit them.</p>
          </div>
        ) : (
          <>
            <div className="bg-card rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Engineer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Aircraft</TableHead>
                    <TableHead className="hidden md:table-cell">ATA</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry: any) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {entry.engineer_name ?? 'Unknown'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Date(entry.task_date).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <div>{entry.aircraft_type}</div>
                        <div className="text-xs text-muted-foreground">{entry.aircraft_registration}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {label(ATA_CHAPTERS, entry.ata_chapter)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {label(MAINTENANCE_CATEGORIES, entry.category)}
                      </TableCell>
                      <TableCell>{Number(entry.duration_hours).toFixed(1)}</TableCell>
                      <TableCell>
                        <Link href={`/logbook/${entry.id}`}>
                          <Button size="sm">Review</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              {page > 1 ? (
                <Link href={`/logbook/verify?page=${page - 1}`}>
                  <Button variant="outline" size="sm" className="bg-transparent border-white/30 text-white hover:bg-white/10">Previous</Button>
                </Link>
              ) : <div />}
              <span className="text-sm text-white/60">Page {page}</span>
              {hasNextPage ? (
                <Link href={`/logbook/verify?page=${page + 1}`}>
                  <Button variant="outline" size="sm" className="bg-transparent border-white/30 text-white hover:bg-white/10">Next</Button>
                </Link>
              ) : <div />}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
