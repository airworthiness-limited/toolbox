import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from './logout-button'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  // ✅ Premium check (FIXED — now inside component)
  const { data: purchase } = await supabase
    .from('purchases')
    .select('id, created_at')
    .eq('user_id', user.id)
    .single()

  // Certificates
  const { data: certificates } = await supabase
    .from('certificates')
    .select('token, issued_at, courses(title)')
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false })

  // Attempts
  const { data: attempts } = await supabase
    .from('exam_attempts')
    .select('id, passed')
    .eq('user_id', user.id)

  const passedCount = attempts?.filter(a => a.passed).length ?? 0
  const totalAttempts = attempts?.length ?? 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}!
            </h1>

            {/* ✅ Premium badge */}
            {purchase && (
              <span className="inline-block mt-2 text-xs font-medium bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                ⭐ Premium member
              </span>
            )}

            <p className="text-gray-500 mt-1">Here&apos;s your learning dashboard.</p>
          </div>
          <LogoutButton />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-white rounded-xl border p-6">
            <p className="text-sm text-gray-500">Certificates earned</p>
            <p className="text-3xl font-bold mt-1">{certificates?.length ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl border p-6">
            <p className="text-sm text-gray-500">Exams passed</p>
            <p className="text-3xl font-bold mt-1">{passedCount}</p>
          </div>
          <div className="bg-white rounded-xl border p-6">
            <p className="text-sm text-gray-500">Total attempts</p>
            <p className="text-3xl font-bold mt-1">{totalAttempts}</p>
          </div>
        </div>

        {/* Certificates */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Certificates</h2>

          {certificates && certificates.length > 0 ? (
            <div className="space-y-3">
              {certificates.map(cert => (
                <div key={cert.token}
                  className="bg-white rounded-xl border p-5 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">
                      {(cert.courses as any)?.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Issued {new Date(cert.issued_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <Link href={`/certificates/${cert.token}`}>
                    <Button variant="outline" size="sm">View →</Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border p-6 text-center text-gray-500">
              <p>No certificates yet.</p>
              <p className="text-sm mt-1">Complete a course and pass the exam to earn one.</p>
            </div>
          )}
        </div>

        {/* CTA */}
        <Link href="/courses">
          <Button>Browse Courses →</Button>
        </Link>

      </div>
    </div>
  )
}