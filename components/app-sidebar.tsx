'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  User,
  LogOut,
  Settings,
  UserPen,
  Menu,
  X,
  ChevronsUpDown,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: User },
  { label: 'Digital Logbook', href: '/logbook', icon: BookOpen },
  { label: 'Module Tracker', href: '/modules', icon: ClipboardList },
  { label: 'Continuation Training', href: '/training', icon: GraduationCap },
]

function useUserProfile() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    async function load(userId: string) {
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single()
      setProfile(data)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) load(session.user.id)
      setLoaded(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) load(session.user.id)
      setLoaded(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, profile, loaded }
}

function getInitials(fullName: string | null): string {
  if (!fullName) return '?'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getFirstName(fullName: string | null): string {
  if (!fullName) return 'User'
  return fullName.trim().split(/\s+/)[0]
}

function UserMenu({ fullName, onLogout, onClose }: { fullName: string | null; onLogout: () => void; onClose?: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const initials = getInitials(fullName)
  const firstName = getFirstName(fullName)

  const menuItems = [
    { label: 'Manage Profile', href: '/profile', icon: UserPen },
    { label: 'Settings', href: '/settings', icon: Settings },
  ]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-sidebar-accent/50 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-sidebar-foreground/10 flex items-center justify-center text-xs font-semibold text-sidebar-foreground flex-shrink-0">
          {initials}
        </div>
        <span className="text-sm font-medium text-sidebar-foreground truncate flex-1 text-left">
          {firstName}
        </span>
        <ChevronsUpDown className="w-4 h-4 text-sidebar-foreground/40 flex-shrink-0" strokeWidth={1.5} />
      </button>

      {open && (
        <div className="absolute bottom-full left-3 right-3 mb-2 bg-popover border border-border rounded-xl shadow-lg py-1 z-50">
          {menuItems.map(item => {
            const Icon = item.icon
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => { setOpen(false); onClose?.() }}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'text-foreground bg-muted'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                {item.label}
              </Link>
            )
          })}
          <div className="h-px bg-border mx-2 my-1" />
          <button
            onClick={() => { setOpen(false); onLogout() }}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
            Log Out
          </button>
        </div>
      )}
    </div>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, loaded } = useUserProfile()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  function isActive(href: string) {
    if (href === '/dashboard' && pathname === '/dashboard') return true
    if (href === '/dashboard') return false
    return pathname === href || pathname.startsWith(href + '/')
  }

  const fullName = profile?.full_name ?? null

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-sidebar min-h-screen fixed left-0 top-0 z-40">
        {/* Brand */}
        <div className="px-5 pt-6 pb-4 text-center">
          <Link href="/" className="text-xl text-sidebar-foreground font-extrabold">
            Airworthiness
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-sidebar-accent text-sidebar-foreground'
                        : 'text-sidebar-foreground/50 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent/50'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User menu */}
        {loaded && user && (
          <div className="px-3 pb-4 mt-auto">
            <div className="border-t border-sidebar-border pt-3">
              <UserMenu fullName={fullName} onLogout={handleLogout} />
            </div>
          </div>
        )}
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-base text-sidebar-foreground font-semibold">
          Airworthiness
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-sidebar-foreground/60 hover:text-sidebar-foreground p-1"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute top-0 left-0 w-60 h-full bg-sidebar flex flex-col pt-14">
            {/* Brand */}
            <div className="px-5 pt-2 pb-4 text-center">
              <Link href="/" className="text-xl text-sidebar-foreground font-extrabold">
                Airworthiness
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3">
              <ul className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          active
                            ? 'bg-sidebar-accent text-sidebar-foreground'
                            : 'text-sidebar-foreground/50 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent/50'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>

            {/* User menu */}
            {loaded && user && (
              <div className="px-3 pb-4 mt-auto">
                <div className="border-t border-sidebar-border pt-3">
                  <UserMenu fullName={fullName} onLogout={handleLogout} onClose={() => setMobileOpen(false)} />
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  )
}
