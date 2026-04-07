'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Rss, X } from 'lucide-react'

interface Props {
  /**
   * The post type to share. Must match a key in lib/post-types.ts.
   */
  postType: string
  /**
   * Type-specific structured data. Must match the validator in lib/post-types.ts.
   */
  data: Record<string, unknown>
  /**
   * Short human-readable preview of what will be shared.
   * E.g. "Passed Module 7A (B1.1)"
   */
  preview: string
  /**
   * Called after the user dismisses or successfully shares.
   * Used so the parent can hide the prompt after action.
   */
  onDone?: () => void
}

/**
 * Inline "Share to feed?" prompt. Designed to appear next to a save action
 * after the user has just hit a milestone. Calls the share-milestone API
 * and disappears on success or dismissal.
 *
 * The prompt is intentionally low-friction: one click to share, one click
 * to dismiss, no modal. It is a soft suggestion, not a forced choice.
 *
 * If the user is not opted in to a public profile or the social_feed flag
 * is off, the API returns an error and the prompt shows it inline. We
 * don't pre-check those conditions because the parent doesn't always
 * know.
 */
export function ShareMilestonePrompt({ postType, data, preview, onDone }: Props) {
  const [state, setState] = useState<'idle' | 'sharing' | 'shared' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  if (state === 'shared') {
    return (
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-2.5 flex items-center justify-between gap-3 mt-2">
        <p className="text-xs text-muted-foreground">Shared to your feed.</p>
        <button onClick={onDone} className="text-muted-foreground hover:text-foreground" aria-label="Dismiss">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  async function share() {
    setState('sharing')
    setError(null)
    const res = await fetch('/api/posts/share-milestone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_type: postType, data }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setState('error')
      setError(body.error ?? 'Failed to share')
      return
    }
    setState('shared')
  }

  function dismiss() {
    onDone?.()
  }

  return (
    <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 mt-2">
      <div className="flex items-center gap-3">
        <Rss className="w-4 h-4 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground">Share to your feed?</p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{preview}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button size="sm" onClick={share} disabled={state === 'sharing'} className="h-7 text-xs">
            {state === 'sharing' ? 'Sharing...' : 'Share'}
          </Button>
          <Button size="sm" variant="outline" onClick={dismiss} className="h-7 text-xs">
            Not now
          </Button>
        </div>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  )
}
