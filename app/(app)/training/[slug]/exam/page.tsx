export const dynamic = 'force-dynamic'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { queryOne, queryAll } from '@/lib/db'
import { ExamForm } from './exam-form'
import { SidebarTriggerInline } from '@/components/sidebar-trigger-inline'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ExamPage({ params }: Props) {
  const { slug } = await params
  const session = await auth()
  const user = session?.user
  if (!user) redirect('/login')

  // Get the course
  const course = await queryOne<Record<string, any>>(
    'SELECT * FROM courses WHERE slug = $1 AND is_published = true',
    [slug]
  )

  if (!course) notFound()

  // Make sure all modules are completed before allowing exam access
  const modules = await queryAll<{ id: string }>(
    'SELECT id FROM modules WHERE course_id = $1',
    [course.id]
  )

  const progress = await queryAll<{ module_id: string }>(
    'SELECT module_id FROM module_progress WHERE user_id = $1',
    [user.id]
  )

  const completedIds = new Set(progress?.map(p => p.module_id) ?? [])
  const allCompleted = modules?.every(m => completedIds.has(m.id))

  if (!allCompleted) {
    redirect(`/training/${slug}`)
  }

  // Check if user already passed this exam
  const exam = await queryOne<Record<string, any>>(
    'SELECT * FROM exams WHERE course_id = $1',
    [course.id]
  )

  if (!exam) {
    return (
      <div className="min-h-screen aw-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center gap-3 justify-center">
            <SidebarTriggerInline />
            <Link href={`/training/${slug}`} className="text-sm text-foreground hover:underline">
              &larr; Back to course
            </Link>
          </div>
          <h1 className="text-xl font-semibold text-foreground mt-4">No exam available yet</h1>
        </div>
      </div>
    )
  }

  const existingPass = await queryOne<{ id: string; score: number }>(
    'SELECT id, score FROM exam_attempts WHERE user_id = $1 AND exam_id = $2 AND passed = true',
    [user.id, exam.id]
  )

  if (existingPass) {
    redirect(`/training/${slug}`)
  }

  // Get questions and answers (shuffle answer order)
  const questions = await queryAll<{ id: string; question_text: string; order_index: number; answers: { id: string; answer_text: string }[] }>(
    'SELECT q.id, q.question_text, q.order_index, COALESCE(json_agg(json_build_object(\'id\', a.id, \'answer_text\', a.answer_text)) FILTER (WHERE a.id IS NOT NULL), \'[]\') as answers FROM questions q LEFT JOIN answers a ON a.question_id = q.id WHERE q.exam_id = $1 GROUP BY q.id, q.question_text, q.order_index ORDER BY q.order_index ASC',
    [exam.id]
  )

  return (
    <div className="min-h-screen aw-gradient">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-6">
          <SidebarTriggerInline />
          <Link href={`/training/${slug}`} className="text-sm text-foreground hover:underline">
            &larr; Back to course
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">{course.title}</h1>
          <p className="text-muted-foreground mt-1">
            Final exam, {questions?.length} questions · Pass mark: {exam.pass_score}%
          </p>
        </div>

	<ExamForm
          questions={questions ?? []}
          examId={exam.id}
          passScore={exam.pass_score}
          courseSlug={slug}
          courseId={course.id}
        />
      </div>
    </div>
  )
}
