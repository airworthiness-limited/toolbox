'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  ShieldCheck,
  User,
  UserCog,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: User },
  { label: 'Manage Profile', href: '/profile', icon: UserCog },
  { label: 'Digital Logbook', href: '/logbook', icon: BookOpen },
  { label: 'Module Tracker', href: '/modules', icon: ClipboardList },
  { label: 'Continuation Training', href: '/training', icon: GraduationCap },
  { label: 'Competency Assessment', href: '', icon: ShieldCheck, comingSoon: true },
]

function useUser() {
  const [user, setUser] = useState<any>(null)
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
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

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loaded } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu open
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

  const navContent = (
    <>
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
            const active = !item.comingSoon && isActive(item.href)

            if (item.comingSoon) {
              return (
                <li key={item.label}>
                  <span
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/20 cursor-default group relative"
                    title="Coming soon..."
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                    {item.label}
                    <span className="ml-auto text-[10px] text-white/30 bg-white/10 px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">Coming Soon</span>
                  </span>
                </li>
              )
            }

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

      {/* User section */}
      {loaded && user && (
        <div className="px-3 pb-4 mt-auto">
          <div className="border-t border-sidebar-border pt-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/40 hover:text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors w-full"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
              Log Out
            </button>
          </div>
        </div>
      )}
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-sidebar min-h-screen fixed left-0 top-0 z-40">
        {navContent}
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
            {navContent}
          </aside>
        </div>
      )}
    </>
  )
}
