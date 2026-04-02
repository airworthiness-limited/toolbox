import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MarkCompleteButton } from './mark-complete-button'

interface Props {
  params: Promise<{ slug: string; moduleId: string }>
}

export default async function ModulePage({ params }: Props) {
  const { slug, moduleId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get the module
  const { data: module } = await supabase
    .from('modules')
    .select('*, courses(title, slug)')
    .eq('id', moduleId)
    .single()

  if (!module) notFound()

  // Get all modules in this course for prev/next navigation
  const { data: allModules } = await supabase
    .from('modules')
    .select('id, title, order_index')
    .eq('course_id', module.course_id)
    .order('order_index', { ascending: true })

  const currentIndex = allModules?.findIndex(m => m.id === moduleId) ?? 0
  const prevModule = allModules?.[currentIndex - 1]
  const nextModule = allModules?.[currentIndex + 1]

  // Check if already completed
  const { data: progressRecord } = await supabase
    .from('module_progress')
    .select('id')
    .eq('user_id', user.id)
    .eq('module_id', moduleId)
    .single()

  const isCompleted = !!progressRecord

  return (
    <div className="min-h-screen aw-gradient">
      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Breadcrumb */}
        <Link href={`/courses/${slug}`} className="text-sm text-blue-600 hover:underline mb-6 block">
          ← Back to course
        </Link>

        {/* Module title */}
        <h1 className="text-2xl font-bold text-white mb-6">{module.title}</h1>

        {/* Content */}
        <div className="bg-white rounded-xl border p-8 prose prose-gray max-w-none">
          {module.content.split('\n\n').map((paragraph: string, i: number) => (
            <p key={i} className="mb-4 text-gray-700 leading-relaxed">{paragraph}</p>
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
              <Link href={`/courses/${slug}/modules/${prevModule.id}`}
                className="text-sm text-blue-600 hover:underline">
                ← {prevModule.title}
              </Link>
            ) : <span />}
            {nextModule && (
              <Link href={`/courses/${slug}/modules/${nextModule.id}`}
                className="text-sm text-blue-600 hover:underline">
                {nextModule.title} →
              </Link>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}