import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/app/dashboard/logout-button'
import { Button } from '@/components/ui/button'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-gray-900 tracking-tight">
          Airworthiness Limited
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/courses"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Courses
          </Link>

          {user ? (
            <>
              <Link href="/logbook"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Logbook
              </Link>
              <Link href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Dashboard
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" size="sm">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign up free</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}