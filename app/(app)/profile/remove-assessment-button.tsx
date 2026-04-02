'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'

export function RemoveAssessmentButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  async function handleRemove() {
    const confirmed = window.confirm(
      'Are you sure you want to remove your competency assessment result?'
    )
    if (!confirmed) return

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('profiles')
      .update({ competency_completed_at: null })
      .eq('id', user.id)

    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={isPending}
      className="text-xs text-red-500 hover:text-red-700 transition-colors"
    >
      {isPending ? 'Removing...' : 'Remove'}
    </button>
  )
}
