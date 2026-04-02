'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function DeleteAccountButton() {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setDeleting(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Delete profile data
    await supabase.from('logbook_entries').delete().eq('user_id', user.id)
    await supabase.from('module_exam_progress').delete().eq('user_id', user.id)
    await supabase.from('certificates').delete().eq('user_id', user.id)
    await supabase.from('purchases').delete().eq('user_id', user.id)
    await supabase.from('profiles').delete().eq('id', user.id)

    // Sign out
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!confirming) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={() => setConfirming(true)}
      >
        Delete My Account
      </Button>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-red-600 font-medium">
        Are you sure? This will permanently delete your profile, logbook entries, certificates, and all associated data.
      </p>
      <div className="flex items-center gap-3">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? 'Deleting...' : 'Yes, Delete Everything'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirming(false)}
          disabled={deleting}
        >
          Cancel
        </Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
