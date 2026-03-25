import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="bg-black sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl font-black text-white tracking-tight" style={{ letterSpacing: '-0.04em' }}>
          AW
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/courses"
            className="text-sm text-neutral-400 hover:text-white transition-colors tracking-wide uppercase">
            Courses
          </Link>

          {user ? (
            <>
              <Link href="/logbook"
                className="text-sm text-neutral-400 hover:text-white transition-colors tracking-wide uppercase">
                Logbook
              </Link>
              <Link href="/progress"
                className="text-sm text-neutral-400 hover:text-white transition-colors tracking-wide uppercase">
                Progress
              </Link>
              <Link href="/profile"
                className="text-sm text-neutral-400 hover:text-white transition-colors tracking-wide uppercase">
                Profile
              </Link>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" size="sm" className="border-neutral-600 text-white hover:bg-white hover:text-black">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-white text-black hover:bg-neutral-200">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
