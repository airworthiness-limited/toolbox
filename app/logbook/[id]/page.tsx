import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ENTRY_STATUSES,
  MAINTENANCE_CATEGORIES,
  AIRCRAFT_CATEGORIES,
  ATA_CHAPTERS,
} from '@/lib/logbook/constants'
import type { EntryStatus } from '@/lib/logbook/constants'
import { EditEntryForm } from './edit-entry-form'
import { SubmitForVerification } from './submit-for-verification'
import { VerificationActions } from './verification-actions'
import { QcActions } from './qc-actions'

interface Props {
  params: Promise<{ id: string }>
}

function label(list: readonly { value: string; label: string }[], value: string) {
  return list.find(i => i.value === value)?.label ?? value
}

export default async function LogbookEntryPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: entry } = await supabase
    .from('logbook_entries')
    .select('*')
    .eq('id', id)
    .single()

  if (!entry) notFound()

  const isOwner = entry.user_id === user.id

  // Fetch verifier info if verified
  let verifierInfo: { full_name: string; aml_licence_number: string } | null = null
  if (entry.verifier_id) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, aml_licence_number')
      .eq('id', entry.verifier_id)
      .single()
    verifierInfo = data
  }

  // Fetch QC info if reviewed
  let qcInfo: { full_name: string } | null = null
  if (entry.qc_auditor_id) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', entry.qc_auditor_id)
      .single()
    qcInfo = data
  }

  // Check if current user is an AML holder (for verification actions)
  const { data: profile } = await supabase
    .from('profiles')
    .select('aml_licence_number, aml_categories')
    .eq('id', user.id)
    .single()

  const isAmlHolder = !!profile?.aml_licence_number
  const canShowVerifyActions = isAmlHolder && !isOwner && entry.status === 'pending_verification'
  const canShowQcActions = !isOwner && entry.verifier_id !== user.id && entry.status === 'pending_qc'

  const isEditable = isOwner && (entry.status === 'draft' || entry.status === 'rejected' || entry.status === 'qc_rejected')
  const canSubmitForVerification = isOwner && entry.status === 'draft'
  const canSubmitForQc = isOwner && entry.status === 'verified'

  const statusInfo = ENTRY_STATUSES[entry.status as EntryStatus]

  // If editable, show edit form
  if (isEditable) {
    // Fetch employers for dropdown
    const { data: periods } = await supabase
      .from('employment_periods')
      .select('employer')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })

    const employers = [...new Set(periods?.map(p => p.employer) ?? [])]

    return (
      <div className="min-h-screen aw-gradient">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-white">Edit Entry</h1>
            <Badge variant={statusInfo.color as 'default' | 'secondary' | 'outline' | 'destructive'}>
              {statusInfo.label}
            </Badge>
          </div>

          {(entry.status === 'rejected' || entry.status === 'qc_rejected') && entry.verifier_comments && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-red-800">Rejection feedback:</p>
              <p className="text-sm text-red-700 mt-1">{entry.verifier_comments}</p>
            </div>
          )}
          {entry.status === 'qc_rejected' && entry.qc_comments && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-red-800">QC feedback:</p>
              <p className="text-sm text-red-700 mt-1">{entry.qc_comments}</p>
            </div>
          )}

          <EditEntryForm entry={entry} employers={employers} />
        </div>
      </div>
    )
  }

  // Read-only view
  return (
    <div className="min-h-screen aw-gradient">
      <div className="max-w-2xl mx-auto px-4 py-12">

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Logbook Entry</h1>
          <Badge variant={statusInfo.color as 'default' | 'secondary' | 'outline' | 'destructive'}>
            {statusInfo.label}
          </Badge>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Row label="Date" value={new Date(entry.task_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />
              <Row label="Aircraft" value={`${entry.aircraft_type}, ${entry.aircraft_registration}`} />
              <Row label="Aircraft Category" value={label(AIRCRAFT_CATEGORIES, entry.aircraft_category)} />
              <Row label="ATA Chapter" value={label(ATA_CHAPTERS, entry.ata_chapter)} />
              <Row label="Maintenance Category" value={label(MAINTENANCE_CATEGORIES, entry.category)} />
              <Row label="Duration" value={`${Number(entry.duration_hours).toFixed(1)} hours`} />
              <Row label="Employer" value={entry.employer} />
              <Row label="Supervised" value={entry.supervised ? 'Yes' : 'No'} />
              {entry.job_number && <Row label="Job Number" value={entry.job_number} />}
              <div className="pt-2">
                <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
                <p className="text-gray-800 whitespace-pre-wrap">{entry.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Verification info */}
          {verifierInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Row label="Verified by" value={verifierInfo.full_name} />
                <Row label="AML Number" value={verifierInfo.aml_licence_number ?? 'N/A'} />
                {entry.verified_at && (
                  <Row label="Date" value={new Date(entry.verified_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />
                )}
                {entry.verifier_comments && <Row label="Comments" value={entry.verifier_comments} />}
              </CardContent>
            </Card>
          )}

          {/* QC info */}
          {qcInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Quality Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Row label="Reviewed by" value={qcInfo.full_name} />
                {entry.qc_reviewed_at && (
                  <Row label="Date" value={new Date(entry.qc_reviewed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />
                )}
                {entry.qc_comments && <Row label="Comments" value={entry.qc_comments} />}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {canSubmitForVerification && (
            <SubmitForVerification entryId={entry.id} />
          )}

          {canSubmitForQc && (
            <SubmitForVerification entryId={entry.id} targetStatus="pending_qc" label="Submit for QC Review" />
          )}

          {canShowVerifyActions && (
            <VerificationActions entryId={entry.id} />
          )}

          {canShowQcActions && (
            <QcActions entryId={entry.id} />
          )}

          <Link href="/logbook">
            <Button variant="outline">Back to Logbook</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-sm text-gray-800 text-right max-w-[60%]">{value}</p>
    </div>
  )
}
