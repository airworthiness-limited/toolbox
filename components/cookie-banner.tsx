'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) setVisible(true)
  }, [])

  async function recordChoice(choice: 'accepted' | 'rejected') {
    localStorage.setItem('cookie-consent', choice)
    setVisible(false)
    // Fire-and-forget — audit logging must never block the UI
    fetch('/api/consent/cookies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ choice }),
    }).catch(() => {})
  }

  function accept() {
    recordChoice('accepted')
  }

  function reject() {
    recordChoice('rejected')
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-card border-t p-4 shadow-lg">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          We use cookies to improve your experience. By continuing to use this site you consent to our use of cookies in accordance with our{' '}
          <Link href="/cookies" className="text-foreground underline hover:text-foreground/90">Cookie Policy</Link>.
        </p>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={reject}>
            Reject
          </Button>
          <Button size="sm" onClick={accept}>
            Accept All
          </Button>
        </div>
      </div>
    </div>
  )
}
