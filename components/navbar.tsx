'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

function useUser() {
  const [user, setUser] = useState<any>(null)
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoaded(true)
    })
  }, [])
  return { user, loaded }
}

function Dropdown({
  label,
  items,
}: {
  label: string
  items: { label: string; href: string | null }[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-sm font-bold text-white/70 hover:text-white transition-colors tracking-wide flex items-center gap-1"
      >
        {label}
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border py-1 z-50">
          {items.map(item => (
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={item.label}
                className="block px-4 py-2.5 text-sm text-gray-400 cursor-default"
              >
                {item.label}
              </span>
            )
          ))}
        </div>
      )}
    </div>
  )
}

export function Navbar() {
  const { user, loaded } = useUser()

  const professionalsItems = user
    ? [
        { label: 'Module Tracker', href: '/progress' },
        { label: 'Digital Logbook', href: '/logbook' },
        { label: 'Continuation Training', href: '/courses' },
        { label: 'Profile', href: '/profile' },
      ]
    : [
        { label: 'Module Tracker', href: '/progress' },
        { label: 'Digital Logbook', href: '/logbook' },
        { label: 'Continuation Training', href: '/courses' },
      ]

  const organisationsItems = [
    { label: 'Independent Audit', href: null },
    { label: 'Crisis Management', href: null },
    { label: 'Nominated Personnel Interviews', href: null },
    { label: 'Safety Review Boards', href: null },
  ]

  return (
    <nav className="aw-gradient sticky top-0 z-50 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl text-white tracking-tight" style={{ fontWeight: 'bold', letterSpacing: '-0.04em' }}>
          Airworthiness
        </Link>

        <div className="flex items-center gap-6">
          <Dropdown label="Professionals" items={professionalsItems} />
          <Dropdown label="Organisations" items={organisationsItems} />

          {loaded && !user && (
            <Link href="/signup">
              <Button size="sm" className="bg-white text-[#1565C0] hover:bg-white/90">
                Sign up
              </Button>
            </Link>
          )}

          {loaded && user && (
            <Link href="/profile">
              <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white hover:text-[#1565C0]">
                My Account
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
