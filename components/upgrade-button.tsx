'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function UpgradeButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleUpgrade() {
    setLoading(true)
    setError('')

    const res = await fetch('/api/checkout', { method: 'POST' })
    const { url, error } = await res.json()

    if (error || !url) {
      setError(error ?? 'Something went wrong')
      setLoading(false)
      return
    }

    window.location.href = url
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleUpgrade} disabled={loading} className="w-full">
        {loading ? 'Redirecting to payment...' : 'Unlock premium access →'}
      </Button>
      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  )
}