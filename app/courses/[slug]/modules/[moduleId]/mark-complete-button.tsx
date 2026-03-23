'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface Props {
  moduleId: string
  courseSlug: string
  isCompleted: boolean
  nextModuleId?: string
}

export function MarkCompleteButton({ moduleId, courseSlug, isCompleted, nextModuleId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(isCompleted)

  async function handleComplete() {
    if (done) return
    setLoading(true)

    // Get the current logged-in user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    // Save progress — user_id is now included so RLS allows the insert
    const { error } = await supabase
      .from('module_progress')
      .upsert({
        module_id: moduleId,
        user_id: user.id        // ← this was the missing piece
      })

    if (error) {
      console.error('Failed to save progress:', error.message)
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)

    if (nextModuleId) {
      router.push(`/courses/${courseSlug}/modules/${nextModuleId}`)
    } else {
      router.push(`/courses/${courseSlug}`)
    }

    router.refresh()
  }

  return (
    <Button
      className="w-full"
      onClick={handleComplete}
      disabled={loading || done}
    >
      {done ? '✓ Completed' : loading ? 'Saving...' : 'Mark as complete'}
    </Button>
  )
}