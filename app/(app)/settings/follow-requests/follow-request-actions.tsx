'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Props {
  followerHandle: string
}

export function FollowRequestActions({ followerHandle }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState<'accepted' | 'declined' | null>(null)

  function act(action: 'accept' | 'decline') {
    startTransition(async () => {
      const res = await fetch('/api/follow/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerHandle, action }),
      })
      if (res.ok) {
        setDone(action === 'accept' ? 'accepted' : 'declined')
        router.refresh()
      }
    })
  }

  if (done) {
    return <span className="text-xs text-muted-foreground">{done}</span>
  }

  return (
    <div className="flex gap-2 shrink-0">
      <Button size="sm" onClick={() => act('accept')} disabled={pending}>Accept</Button>
      <Button size="sm" variant="outline" onClick={() => act('decline')} disabled={pending}>Decline</Button>
    </div>
  )
}
