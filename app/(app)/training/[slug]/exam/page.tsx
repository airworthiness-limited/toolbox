import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ExamForm } from './exam-form'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ExamPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get the course
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!course) notFound()

  // Make sure all modules are completed before allowing exam access
  const { data: modules } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', course.id)

  const { data: progress } = await supabase
    .from('module_progress')
    .select('module_id')
    .eq('user_id', user.id)

  const completedIds = new Set(progress?.map(p => p.module_id) ?? [])
  const allCompleted = modules?.every(m => completedIds.has(m.id))

  if (!allCompleted) {
    redirect(`/training/${slug}`)
  }

  // Check if user already passed this exam
  const { data: exam } = await supabase
    .from('exams')
    .select('*')
    .eq('course_id', course.id)
    .single()

  if (!exam) {
    return (
      <div className="min-h-screen aw-gradient flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground">No exam available yet</h1>
          <Link href={`/training/${slug}`} className="text-foreground hover:underline mt-2 block">
            ← Back to course
          </Link>
        </div>
      </div>
    )
  }

  const { data: existingPass } = await supabase
    .from('exam_attempts')
    .select('id, score')
    .eq('user_id', user.id)
    .eq('exam_id', exam.id)
    .eq('passed', true)
    .single()

  if (existingPass) {
    redirect(`/training/${slug}`)
  }

  // Get questions and answers (shuffle answer order)
  const { data: questions } = await supabase
    .from('questions')
    .select('id, question_text, order_index, answers(id, answer_text)')
    .eq('exam_id', exam.id)
    .order('order_index', { ascending: true })

  return (
    <div className="min-h-screen aw-gradient">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href={`/training/${slug}`}
          className="text-sm text-foreground hover:underline mb-6 block">
          ← Back to course
        </Link>

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