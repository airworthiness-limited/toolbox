'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

function useUser() {
  const [user, setUser] = useState<any>(null)
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
      }
      setLoaded(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoaded(true)
    })
    return () => subscription.unsubscribe()
  }, [])
  return { user, loaded }
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
        className={`text-sm font-medium transition-colors flex items-center gap-1 ${
          isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
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
                className={`block px-4 py-2.5 text-sm font-medium transition-colors ${
                  pathname === item.href || pathname.startsWith(item.href + '/')
                    ? 'text-[#123456] bg-gray-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={item.label}
                className="block px-4 py-2.5 text-sm font-medium text-gray-400 cursor-default"
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
  professionalsItems,
  organisationsItems,
}: {
  open: boolean
  onClose: () => void
  user: any
  loaded: boolean
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
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute top-0 right-0 w-72 h-full bg-white shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <span className="font-bold text-gray-900 tracking-tight">Menu</span>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-900 p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <div className="pt-2">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2">Professionals</p>
            {professionalsItems.map(item => (
              item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className={`block py-2.5 text-sm font-medium ${
                    pathname === item.href || pathname.startsWith(item.href + '/')
                      ? 'text-[#123456]'
                      : 'text-gray-600'
                  }`}
                >
                  {item.label}
                </Link>
              ) : (
                <span key={item.label} className="block py-2.5 text-sm font-medium text-gray-300">
                  {item.label}
                </span>
              )
            ))}
          </div>

          <div className="border-t border-gray-100 mt-4 pt-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2">Organisations</p>
            {organisationsItems.map(item => (
              item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className={`block py-2.5 text-sm font-medium ${
                    pathname === item.href ? 'text-[#123456]' : 'text-gray-600'
                  }`}
                >
                  {item.label}
                </Link>
              ) : (
                <span key={item.label} className="block py-2.5 text-sm font-medium text-gray-300">
                  {item.label}
                </span>
              )
            ))}
          </div>

          <div className="border-t border-gray-100 mt-4 pt-4 space-y-3">
            {loaded && !user && (
              <Link href="/signup" onClick={onClose}>
                <Button className="w-full bg-[#123456] text-white hover:bg-[#0e2a45] font-semibold">
                  Sign up
                </Button>
              </Link>
            )}
            {loaded && user && (
              <Link href="/profile" onClick={onClose}>
                <Button variant="outline" className="w-full font-semibold">
                  Account
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
  const { user, loaded } = useUser()
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
      <nav className="bg-white sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="text-xl text-gray-900 tracking-tight font-extrabold">
            Airworthiness
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {loaded && !user && (
              <>
                <a href="mailto:contact@airworthiness.org.uk">
                  <Button variant="outline" className="font-semibold border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl px-6 h-10 text-sm">
                    Consultancy
                  </Button>
                </a>
                <Link href="/signup">
                  <Button className="bg-[#123456] text-white hover:bg-[#0e2a45] font-semibold rounded-xl px-6 h-10 text-sm">
                    Get started
                  </Button>
                </Link>
              </>
            )}

            {loaded && user && (
              <Link href="/profile">
                <Button variant="outline" size="sm" className="font-semibold">
                  Account
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="md:hidden text-gray-400 hover:text-gray-900 p-1"
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
        professionalsItems={professionalsItems}
        organisationsItems={organisationsItems}
      />
    </>
  )
}
