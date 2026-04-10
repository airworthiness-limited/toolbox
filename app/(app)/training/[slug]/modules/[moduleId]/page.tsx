export const dynamic = 'force-dynamic'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { queryOne, queryAll } from '@/lib/db'
import { MarkCompleteButton } from './mark-complete-button'
import { SidebarTriggerInline } from '@/components/sidebar-trigger-inline'

interface Props {
  params: Promise<{ slug: string; moduleId: string }>
}

export default async function ModulePage({ params }: Props) {
  const { slug, moduleId } = await params
  const session = await auth()
  const user = session?.user
  if (!user) redirect('/login')

  // Get the module
  const module = await queryOne<Record<string, any>>(
    'SELECT m.*, json_build_object(\'title\', c.title, \'slug\', c.slug) as courses FROM modules m LEFT JOIN courses c ON c.id = m.course_id WHERE m.id = $1',
    [moduleId]
  )

  if (!module) notFound()

  // Get all modules in this course for prev/next navigation
  const allModules = await queryAll<{ id: string; title: string; order_index: number }>(
    'SELECT id, title, order_index FROM modules WHERE course_id = $1 ORDER BY order_index ASC',
    [module.course_id]
  )

  const currentIndex = allModules?.findIndex(m => m.id === moduleId) ?? 0
  const prevModule = allModules?.[currentIndex - 1]
  const nextModule = allModules?.[currentIndex + 1]

  // Check if already completed
  const progressRecord = await queryOne<{ id: string }>(
    'SELECT id FROM module_progress WHERE user_id = $1 AND module_id = $2',
    [user.id, moduleId]
  )

  const isCompleted = !!progressRecord

  return (
    <div className="min-h-screen aw-gradient">
      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-6">
          <SidebarTriggerInline />
          <Link href={`/training/${slug}`} className="text-sm text-foreground hover:underline">
            &larr; Back to course
          </Link>
        </div>

        {/* Module title */}
        <h1 className="text-2xl font-semibold text-white mb-6">{module.title}</h1>

        {/* Content */}
        <div className="bg-card rounded-xl border p-8 prose prose-gray max-w-none">
          {module.content.split('\n\n').map((paragraph: string, i: number) => (
            <p key={i} className="mb-4 text-foreground leading-relaxed">{paragraph}</p>
          ))}
        </div>

        {/* Mark complete + navigation */}
        <div className="mt-8 flex flex-col gap-4">
          <MarkCompleteButton
            moduleId={moduleId}
            courseSlug={slug}
            isCompleted={isCompleted}
            nextModuleId={nextModule?.id}
          />

          <div className="flex justify-between">
            {prevModule ? (
              <Link href={`/training/${slug}/modules/${prevModule.id}`}
                className="text-sm text-foreground hover:underline">
                &larr; {prevModule.title}
              </Link>
            ) : <span />}
            {nextModule && (
              <Link href={`/training/${slug}/modules/${nextModule.id}`}
                className="text-sm text-foreground hover:underline">
                {nextModule.title} &rarr;
              </Link>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
