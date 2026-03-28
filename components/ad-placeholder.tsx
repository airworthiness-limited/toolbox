'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AdPlaceholderProps {
  format?: 'banner' | 'sidebar' | 'inline'
  className?: string
}

function useAdFreeStatus() {
  const [hasPremium, setHasPremium] = useState<boolean | null>(null)
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        setHasPremium(false)
        return
      }
      supabase
        .from('purchases')
        .select('id')
        .eq('user_id', data.user.id)
        .single()
        .then(({ data: purchase }) => {
          setHasPremium(!!purchase)
        })
    })
  }, [])
  return hasPremium
}

function GoAdFreeLink() {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    const res = await fetch('/api/checkout', { method: 'POST' })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-[10px] text-amber-600 hover:text-amber-700 font-bold mt-1 hover:underline transition-colors"
    >
      {loading ? 'Redirecting...' : 'Remove ads'}
    </button>
  )
}

export function AdPlaceholder({ format = 'banner', className = '' }: AdPlaceholderProps) {
  const hasPremium = useAdFreeStatus()

  // Hide ads for premium users, or while loading auth state
  if (hasPremium !== false) return null

  const sizes = {
    banner: 'w-full h-[90px]',
    sidebar: 'w-[300px] h-[250px]',
    inline: 'w-full h-[250px]',
  }

  return (
    <div className={`${sizes[format]} bg-gray-100 border border-dashed border-gray-300 rounded-lg flex items-center justify-center ${className}`}>
      <div className="text-center">
        <p className="text-xs text-gray-400 font-medium">Advertisement</p>
        <p className="text-[10px] text-gray-300 mt-0.5">Google AdSense</p>
        <GoAdFreeLink />
      </div>
    </div>
  )
}
