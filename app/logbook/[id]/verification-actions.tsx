'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  entryId: string
}

export function VerificationActions({ entryId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [action, setAction] = useState<'approve' | 'reject' | null>(null)
  const [comments, setComments] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleVerify(approved: boolean) {
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSubmitting(false); return }

    await supabase
      .from('logbook_entries')
      .update({
        status: approved ? 'verified' : 'rejected',
        verifier_id: user.id,
        verifier_comments: comments || null,
        verified_at: approved ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', entryId)

    router.refresh()
    setSubmitting(false)
  }

  if (!action) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AML Verification</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button onClick={() => setAction('approve')} className="flex-1">
            Approve
          </Button>
          <Button variant="destructive" onClick={() => setAction('reject')} className="flex-1">
            Reject
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{action === 'approve' ? 'Approve Entry' : 'Reject Entry'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label>Comments {action === 'reject' ? '(required)' : '(optional)'}</Label>
          <Textarea
            value={comments}
            onChange={e => setComments(e.target.value)}
            placeholder={action === 'reject' ? 'Explain why this entry is being rejected...' : 'Any additional notes...'}
            rows={3}
          />
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => handleVerify(action === 'approve')}
            disabled={submitting || (action === 'reject' && !comments)}
            variant={action === 'approve' ? 'default' : 'destructive'}
            className="flex-1"
          >
            {submitting ? 'Submitting...' : action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
          </Button>
          <Button variant="outline" onClick={() => setAction(null)}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
