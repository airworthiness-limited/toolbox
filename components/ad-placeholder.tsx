'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

declare global {
  interface Window {
    adsbygoogle: Record<string, unknown>[]
  }
}

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

export function AdPlaceholder({ format = 'banner', className = '' }: AdPlaceholderProps) {
  const hasPremium = useAdFreeStatus()
  const adRef = useRef<HTMLModElement>(null)
  const pushed = useRef(false)
  const [adLoaded, setAdLoaded] = useState(false)

  useEffect(() => {
    if (hasPremium !== false) return
    if (pushed.current) return
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({})
      pushed.current = true
    } catch {
      // AdSense not loaded yet or ad blocker active
    }

    // Poll for actual ad fill via data-ad-status attribute
    const interval = setInterval(() => {
      if (adRef.current) {
        const status = adRef.current.getAttribute('data-ad-status')
        if (status === 'filled') {
          setAdLoaded(true)
          clearInterval(interval)
        }
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [hasPremium])

  // Hide ads for premium users, or while loading auth state
  if (hasPremium !== false) return null

  const sizes = {
    banner: 'w-full h-[90px]',
    sidebar: 'w-[300px] h-[250px]',
    inline: 'w-full h-[250px]',
  }

  const adStyles: Record<string, { display: string; width?: string; height?: string }> = {
    banner: { display: 'block', width: '100%', height: '90px' },
    sidebar: { display: 'inline-block', width: '300px', height: '250px' },
    inline: { display: 'block', width: '100%', height: '250px' },
  }

  return (
    <div className={`relative print:hidden ${className}`}>
      {/* Placeholder fallback — visible until a real ad fills */}
      {!adLoaded && (
        <div className={`${sizes[format]} bg-gray-100 border border-dashed border-gray-300 rounded-lg flex items-center justify-center`}>
          <div className="text-center">
            <p className="text-xs text-gray-400 font-medium">Advertisement</p>
            <p className="text-[10px] text-gray-300 mt-0.5">Google AdSense</p>
          </div>
        </div>
      )}
      {/* Real ad unit — hidden behind placeholder until it fills */}
      <ins
        ref={adRef}
        className={`adsbygoogle ${adLoaded ? '' : 'absolute inset-0 opacity-0 overflow-hidden'}`}
        style={adLoaded ? adStyles[format] : { display: 'block', width: '0', height: '0' }}
        data-ad-client="ca-pub-7968073666840898"
        data-ad-format={format === 'banner' ? 'horizontal' : format === 'sidebar' ? 'rectangle' : 'auto'}
        data-full-width-responsive={format !== 'sidebar' ? 'true' : 'false'}
      />
    </div>
  )
}
