'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Props {
  targetHandle: string
  initialState: 'none' | 'pending' | 'active'
}

export function FollowButton({ targetHandle, initialState }: Props) {
  const router = useRouter()
  const [state, setState] = useState(initialState)
  const [pending, startTransition] = useTransition()
  const [hover, setHover] = useState(false)

  async function follow() {
    setState('active')
    startTransition(async () => {
      const res = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetHandle }),
      })
      if (!res.ok) {
        setState('none')
        return
      }
      const data = await res.json()
      setState(data.status === 'pending' ? 'pending' : 'active')
      router.refresh()
    })
  }

  async function unfollow() {
    if (!window.confirm(`Unfollow @${targetHandle}?`)) return
    setState('none')
    startTransition(async () => {
      const res = await fetch('/api/follow', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetHandle }),
      })
      if (!res.ok) {
        setState('active')
        return
      }
      router.refresh()
    })
  }

  if (state === 'none') {
    return (
      <Button size="sm" onClick={follow} disabled={pending}>
        Follow
      </Button>
    )
  }

  if (state === 'pending') {
    return (
      <Button size="sm" variant="outline" onClick={unfollow} disabled={pending}>
        Requested
      </Button>
    )
  }

  // active
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={unfollow}
      disabled={pending}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {hover ? 'Unfollow' : 'Following'}
    </Button>
  )
}
