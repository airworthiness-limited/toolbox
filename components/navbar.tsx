'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

function useUser() {
  const [user, setUser] = useState<any>(null)
  const [loaded, setLoaded] = useState(false)
  const [hasPremium, setHasPremium] = useState(false)
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoaded(true)
      if (data.user) {
        supabase
          .from('purchases')
          .select('id')
          .eq('user_id', data.user.id)
          .single()
          .then(({ data: purchase }) => {
            setHasPremium(!!purchase)
          })
      }
    })
  }, [])
  return { user, loaded, hasPremium }
}

function RemoveAdvertsButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    const res = await fetch('/api/checkout', { method: 'POST' })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      // Not logged in — send to signup
      window.location.href = '/signup'
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`bg-white text-[#2d3a80] text-xs font-bold px-3 py-1.5 rounded-full hover:bg-white/90 transition-colors tracking-wide uppercase ${className ?? ''}`}
    >
      {loading ? 'REDIRECTING...' : 'REMOVE ADVERTS'}
    </button>
  )
}

function Dropdown({
  label,
  items,
  isActive,
}: {
  label: string
  items: { label: string; href: string | null }[]
  isActive?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

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
        className={`text-sm font-bold transition-colors tracking-wide uppercase flex items-center gap-1 ${
          isActive ? 'text-white' : 'text-white/70 hover:text-white'
        }`}
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
                className={`block px-4 py-2.5 text-sm font-bold transition-colors ${
                  pathname === item.href || pathname.startsWith(item.href + '/')
                    ? 'text-[#2d3a80] bg-gray-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={item.label}
                className="block px-4 py-2.5 text-sm font-bold text-gray-400 cursor-default"
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

function MobileMenu({
  open,
  onClose,
  user,
  loaded,
  hasPremium,
  professionalsItems,
  organisationsItems,
}: {
  open: boolean
  onClose: () => void
  user: any
  loaded: boolean
  hasPremium: boolean
  professionalsItems: { label: string; href: string | null }[]
  organisationsItems: { label: string; href: string | null }[]
}) {
  const pathname = usePathname()

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute top-0 right-0 w-72 h-full bg-gray-950 shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <span className="text-white font-bold tracking-tight">Menu</span>
          <button type="button" onClick={onClose} className="text-white/70 hover:text-white p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <Link
            href="/about"
            onClick={onClose}
            className={`block py-3 text-sm font-bold uppercase tracking-wider ${
              pathname === '/about' ? 'text-white' : 'text-white/70'
            }`}
          >
            About
          </Link>

          <div className="border-t border-white/10 mt-2 pt-4">
            <p className="text-xs text-white/40 uppercase tracking-wider font-bold mb-2">Professionals</p>
            {professionalsItems.map(item => (
              item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className={`block py-2.5 text-sm font-bold ${
                    pathname === item.href || pathname.startsWith(item.href + '/')
                      ? 'text-white'
                      : 'text-white/70'
                  }`}
                >
                  {item.label}
                </Link>
              ) : (
                <span key={item.label} className="block py-2.5 text-sm font-bold text-white/30">
                  {item.label}
                </span>
              )
            ))}
          </div>

          <div className="border-t border-white/10 mt-4 pt-4">
            <p className="text-xs text-white/40 uppercase tracking-wider font-bold mb-2">Organisations</p>
            {organisationsItems.map(item => (
              item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className={`block py-2.5 text-sm font-bold ${
                    pathname === item.href ? 'text-white' : 'text-white/70'
                  }`}
                >
                  {item.label}
                </Link>
              ) : (
                <span key={item.label} className="block py-2.5 text-sm font-bold text-white/30">
                  {item.label}
                </span>
              )
            ))}
          </div>

          <div className="border-t border-white/10 mt-4 pt-4 space-y-3">
            {loaded && !hasPremium && (
              <RemoveAdvertsButton className="w-full" />
            )}
            {loaded && !user && (
              <Link href="/signup" onClick={onClose}>
                <Button className="w-full bg-white text-[#2d3a80] hover:bg-white/90 font-bold">
                  Sign up
                </Button>
              </Link>
            )}
            {loaded && user && (
              <Link href="/profile" onClick={onClose}>
                <Button variant="outline" className="w-full bg-transparent border-white/30 text-white hover:bg-white hover:text-[#2d3a80] font-bold">
                  Manage Profile
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function Navbar() {
  const { user, loaded, hasPremium } = useUser()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

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

  const professionalsActive = ['/progress', '/logbook', '/courses', '/profile'].some(
    p => pathname === p || pathname.startsWith(p + '/')
  )

  return (
    <>
      <nav className="aw-gradient sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl text-white tracking-tight" style={{ fontWeight: 'bold', letterSpacing: '-0.04em' }}>
              Airworthiness
            </Link>
            {loaded && !hasPremium && <RemoveAdvertsButton />}
            {loaded && hasPremium && (
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full tracking-wide uppercase">
                SUBSCRIBED
              </span>
            )}
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/about"
              className={`text-sm font-bold transition-colors tracking-wide uppercase ${
                pathname === '/about' ? 'text-white' : 'text-white/70 hover:text-white'
              }`}>
              About
            </Link>

            <Dropdown label="Professionals" items={professionalsItems} isActive={professionalsActive} />
            <Dropdown label="Organisations" items={organisationsItems} />

            {loaded && !user && (
              <Link href="/signup">
                <Button size="sm" className="bg-white text-[#2d3a80] hover:bg-white/90 font-bold">
                  Sign up
                </Button>
              </Link>
            )}

            {loaded && user && (
              <Link href="/profile">
                <Button variant="outline" size="sm" className="bg-transparent border-white/30 text-white hover:bg-white hover:text-[#2d3a80] font-bold">
                  Manage Profile
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="md:hidden text-white/70 hover:text-white p-1"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user}
        loaded={loaded}
        hasPremium={hasPremium}
        professionalsItems={professionalsItems}
        organisationsItems={organisationsItems}
      />
    </>
  )
}
