'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface Props {
  entryId: string
  targetStatus?: string
  label?: string
}

export function SubmitForVerification({
  entryId,
  targetStatus = 'pending_verification',
  label = 'Submit for Verification',
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    setSubmitting(true)

    await supabase
      .from('logbook_entries')
      .update({ status: targetStatus, updated_at: new Date().toISOString() })
      .eq('id', entryId)

    router.refresh()
    setSubmitting(false)
  }

  return (
    <Button onClick={handleSubmit} disabled={submitting} className="w-full">
      {submitting ? 'Submitting...' : label}
    </Button>
  )
}
