export const dynamic = 'force-dynamic'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { queryOne, queryAll } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UpgradeButton } from '@/components/upgrade-button'
import { SidebarTriggerInline } from '@/components/sidebar-trigger-inline'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function CoursePage({ params }: Props) {
  const { slug } = await params
  const session = await auth()
  const user = session?.user
  if (!user) redirect('/login')

  // Get course first (needed for course_id in subsequent queries)
  const course = await queryOne<{ id: string; title: string; slug: string; description: string; is_premium: boolean; is_published: boolean }>(
    'SELECT id, title, slug, description, is_premium, is_published FROM courses WHERE slug = $1 AND is_published = true',
    [slug]
  )

  if (!course) notFound()

  // Run remaining queries in parallel
  const [
    modules,
    progress,
    purchase,
    certificate,
  ] = await Promise.all([
    queryAll<{ id: string; title: string; order_index: number }>(
      'SELECT id, title, order_index FROM modules WHERE course_id = $1 ORDER BY order_index ASC',
      [course.id]
    ),
    queryAll<{ module_id: string }>(
      'SELECT module_id FROM module_progress WHERE user_id = $1',
      [user.id]
    ),
    queryOne<{ id: string }>(
      'SELECT id FROM purchases WHERE user_id = $1',
      [user.id]
    ),
    queryOne<{ token: string }>(
      'SELECT token FROM certificates WHERE user_id = $1 AND course_id = $2',
      [user.id, course.id]
    ),
  ])

  const completedIds = new Set(progress?.map(p => p.module_id) ?? [])
  const completedCount = modules?.filter(m => completedIds.has(m.id)).length ?? 0
  const totalModules = modules?.length ?? 0
  const hasPremium = !!purchase

  return (
    <div className="min-h-screen aw-gradient">
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Back */}
        <div className="flex items-center gap-3 mb-6">
          <SidebarTriggerInline />
          <Link href="/training" className="text-sm text-foreground hover:underline">
            &larr; Back to courses
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold text-white">{course.title}</h1>
            {course.is_premium && <Badge variant="secondary">Premium</Badge>}
          </div>
          <p className="text-white/60">{course.description}</p>

          {/* Progress */}
          {totalModules > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>{completedCount} of {totalModules} modules completed</span>
                <span>{Math.round((completedCount / totalModules) * 100)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-foreground h-2 rounded-full"
                  style={{ width: `${(completedCount / totalModules) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* PAYWALL */}
        {course.is_premium && !hasPremium && (
          <div className="my-8 bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">🔒</div>
            <h2 className="text-lg font-semibold text-amber-900 mb-2">
              This is a premium course
            </h2>
            <p className="text-amber-700 mb-6">
              Unlock all premium courses with a one-time payment.
            </p>
            <div className="max-w-xs mx-auto">
              <UpgradeButton />
            </div>
          </div>
        )}

        {/* CONTENT (only if allowed) */}
        {(!course.is_premium || hasPremium) && (
          <>
            {/* Modules */}
            <div className="space-y-3">
              {modules?.map((module, index) => {
                const isCompleted = completedIds.has(module.id)

                return (
                  <Link key={module.id} href={`/training/${slug}/modules/${module.id}`}>
                    <div className="bg-card rounded-xl border p-4 hover:shadow-md flex justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm
                          ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                          {isCompleted ? '✓' : index + 1}
                        </div>
                        <span className="font-medium">{module.title}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {isCompleted ? 'Completed' : 'Start →'}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* EXAM / CERT CTA */}
            {completedCount === totalModules && totalModules > 0 && (
              <div className="mt-8 bg-muted border border-border rounded-xl p-6 text-center">
                {certificate ? (
                  <>
                    <h2 className="text-lg font-semibold text-foreground">
                      🏆 You've earned a certificate!
                    </h2>
                    <p className="text-foreground mt-1 mb-4">
                      You passed this course. View or share your certificate.
                    </p>
                    <Link href={`/certificates/${certificate.token}`}>
                      <Button>View certificate &rarr;</Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold text-foreground">
                      You've completed all modules!
                    </h2>
                    <p className="text-foreground mt-1 mb-4">
                      Ready to take the exam and earn your certificate?
                    </p>
                    <Link href={`/training/${slug}/exam`}>
                      <Button>Take the exam &rarr;</Button>
                    </Link>
                  </>
                )}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
