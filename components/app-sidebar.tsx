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
  Rss,
  Bell,
  Search,
  GripVertical,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: User },
  { label: 'Social Feed', href: '/feed', icon: Rss },
  { label: 'Discover', href: '/discover', icon: Search },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Digital Logbook', href: '/logbook', icon: BookOpen },
  { label: 'Module Tracker', href: '/modules', icon: ClipboardList },
  { label: 'Continuation Training', href: '/training', icon: GraduationCap },
]

const NAV_ORDER_KEY = 'sidebar-nav-order'

function useOrderedNav() {
  const [order, setOrder] = useState<string[]>(() => NAV_ITEMS.map(i => i.href))

  useEffect(() => {
    try {
      const stored = localStorage.getItem(NAV_ORDER_KEY)
      if (stored) {
        const parsed: string[] = JSON.parse(stored)
        // Keep only known hrefs, then append any new items not in stored order
        const known = parsed.filter(h => NAV_ITEMS.some(i => i.href === h))
        const missing = NAV_ITEMS.map(i => i.href).filter(h => !known.includes(h))
        setOrder([...known, ...missing])
      }
    } catch {}
  }, [])

  const items = order
    .map(href => NAV_ITEMS.find(i => i.href === href))
    .filter((i): i is typeof NAV_ITEMS[number] => !!i)

  function persist(next: string[]) {
    setOrder(next)
    try { localStorage.setItem(NAV_ORDER_KEY, JSON.stringify(next)) } catch {}
  }

  function move(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= order.length || to >= order.length) return
    const next = order.slice()
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    persist(next)
  }

  return { items, move }
}

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

function useUnreadNotificationCount(user: any): number {
  const [count, setCount] = useState(0)
  const pathname = usePathname()

  useEffect(() => {
    if (!user) return
    let cancelled = false
    const supabase = createClient()
    async function load() {
      const { data } = await supabase.rpc('get_unread_notification_count')
      if (!cancelled && typeof data === 'number') setCount(data)
    }
    load()
    // Refresh on path change so the badge clears after visiting /notifications
    return () => { cancelled = true }
  }, [user, pathname])

  return count
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
    { label: 'Manage Profile', href: '/account', icon: UserPen },
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
        <div className="absolute bottom-full left-0 mb-2 w-56 bg-popover border border-border rounded-xl shadow-xl py-1.5 z-[60]">
          {/* User info header */}
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-foreground truncate">{fullName || 'User'}</p>
          </div>
          <div className="h-px bg-border mx-2 mb-1" />
          {menuItems.map(item => {
            const Icon = item.icon
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => { setOpen(false); onClose?.() }}
                className={`flex items-center gap-3 mx-1.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'text-foreground bg-muted'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0 text-muted-foreground" strokeWidth={1.5} />
                {item.label}
              </Link>
            )
          })}
          <div className="h-px bg-border mx-2 my-1" />
          <button
            onClick={() => { setOpen(false); onLogout() }}
            className="flex items-center gap-3 mx-1.5 px-2.5 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors w-[calc(100%-0.75rem)]"
          >
            <LogOut className="w-4 h-4 flex-shrink-0 text-muted-foreground" strokeWidth={1.5} />
            Log Out
          </button>
        </div>
      )}
    </div>
  )
}

export function SidebarTrigger() {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
      className="md:hidden text-current opacity-60 hover:opacity-100 rounded-lg transition-colors flex-shrink-0"
      aria-label="Open menu"
    >
      <Menu className="w-5 h-5" />
    </button>
  )
}

function NavList({
  items,
  isActive,
  unreadCount,
  onDropMove,
  onItemClick,
}: {
  items: typeof NAV_ITEMS
  isActive: (href: string) => boolean
  unreadCount: number
  onDropMove: (from: number, to: number) => void
  onItemClick?: () => void
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  return (
    <ul className="space-y-1">
      {items.map((item, index) => {
        const Icon = item.icon
        const active = isActive(item.href)
        const showBadge = item.href === '/notifications' && unreadCount > 0
        const isOver = overIndex === index && dragIndex !== null && dragIndex !== index

        return (
          <li
            key={item.href}
            onDragOver={e => { if (dragIndex !== null) { e.preventDefault(); setOverIndex(index) } }}
            onDragLeave={() => { if (overIndex === index) setOverIndex(null) }}
            onDrop={e => {
              e.preventDefault()
              if (dragIndex !== null) onDropMove(dragIndex, index)
              setDragIndex(null)
              setOverIndex(null)
            }}
            className={`group relative flex items-center rounded-lg ${
              active
                ? 'bg-sidebar-accent'
                : 'hover:bg-sidebar-accent/50'
            } ${isOver ? 'ring-2 ring-foreground/20' : ''} ${dragIndex === index ? 'opacity-40' : ''}`}
          >
            <Link
              href={item.href}
              onClick={onItemClick}
              className={`flex items-center gap-3 flex-1 min-w-0 px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'text-sidebar-foreground'
                  : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
              <span className="flex-1 truncate">{item.label}</span>
              {showBadge && (
                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-foreground text-background text-xs font-semibold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
            <span
              draggable
              onDragStart={e => { setDragIndex(index); e.dataTransfer.effectAllowed = 'move' }}
              onDragEnd={() => { setDragIndex(null); setOverIndex(null) }}
              aria-label={`Drag to reorder ${item.label}`}
              className="flex-shrink-0 px-2 py-2.5 cursor-grab active:cursor-grabbing text-sidebar-foreground/30 hover:text-sidebar-foreground/70 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <GripVertical className="w-4 h-4" strokeWidth={1.5} />
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, loaded } = useUserProfile()
  const unreadCount = useUnreadNotificationCount(user)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { items: navItems, move: moveNav } = useOrderedNav()

  // Listen for external triggers
  useEffect(() => {
    function handleToggle() { setMobileOpen(true) }
    function handleClose() { setMobileOpen(false) }
    window.addEventListener('toggle-sidebar', handleToggle)
    window.addEventListener('close-sidebar', handleClose)
    return () => {
      window.removeEventListener('toggle-sidebar', handleToggle)
      window.removeEventListener('close-sidebar', handleClose)
    }
  }, [])

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
      <aside className="hidden md:flex flex-col w-60 bg-background border-r border-border/50 min-h-screen fixed left-0 top-0 z-40 shadow-[1px_0_3px_rgba(0,0,0,0.04)]">
        {/* Brand */}
        <div className="px-3 pt-6 pb-4">
          <div className="px-3">
            <Link href="/" className="text-xl text-sidebar-foreground font-bold tracking-tight">
              Airworthiness
            </Link>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3">
          <NavList
            items={navItems}
            isActive={isActive}
            unreadCount={unreadCount}
            onDropMove={moveNav}
          />
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

      {/* Mobile sidebar overlay + slide animation */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-opacity duration-200 ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="absolute inset-0" onClick={() => setMobileOpen(false)} />
        <aside className={`absolute top-0 left-0 w-60 h-full bg-background border-r border-border/50 shadow-lg flex flex-col transition-transform duration-200 ease-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {/* Brand + close */}
          <div className="px-3 pt-6 pb-4 flex items-center justify-between">
            <div className="px-3">
              <Link href="/" className="text-xl text-sidebar-foreground font-bold tracking-tight">
                Airworthiness
              </Link>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="text-sidebar-foreground/40 hover:text-sidebar-foreground p-1 rounded-lg hover:bg-sidebar-accent/50 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3">
            <NavList
              items={navItems}
              isActive={isActive}
              unreadCount={unreadCount}
              onDropMove={moveNav}
              onItemClick={() => setMobileOpen(false)}
            />
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
    </>
  )
}
