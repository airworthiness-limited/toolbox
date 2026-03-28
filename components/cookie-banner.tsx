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

  function accept() {
    localStorage.setItem('cookie-consent', 'accepted')
    setVisible(false)
  }

  function reject() {
    localStorage.setItem('cookie-consent', 'rejected')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-gray-950 border-t border-white/10 p-4 shadow-lg">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-sm text-white/70 leading-relaxed">
          We use cookies to improve your experience and serve relevant advertisements. By continuing to use this site you consent to our use of cookies in accordance with our{' '}
          <Link href="/cookies" className="text-white underline hover:text-white/90">Cookie Policy</Link>.
        </p>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={reject} className="bg-transparent border-white/20 text-white hover:bg-white/10">
            Reject
          </Button>
          <Button size="sm" onClick={accept} className="bg-white text-gray-900 hover:bg-white/90">
            Accept All
          </Button>
        </div>
      </div>
    </div>
  )
}
