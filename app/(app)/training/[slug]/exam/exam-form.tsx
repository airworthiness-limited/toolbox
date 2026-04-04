'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface Answer {
  id: string
  answer_text: string
}

interface Question {
  id: string
  question_text: string
  order_index: number
  answers: Answer[]
}

interface Props {
  questions: Question[]
  examId: string
  passScore: number
  courseSlug: string
  courseId: string
}

export function ExamForm({ questions, examId, passScore, courseSlug, courseId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [selected, setSelected] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{
    score: number
    passed: boolean
    correctCount: number
    total: number
  } | null>(null)

  const allAnswered = questions.every(q => selected[q.id])

  async function handleSubmit() {
    if (!allAnswered) return
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSubmitting(false)
      return
    }

    const { data: correctAnswers } = await supabase
      .from('answers')
      .select('id, question_id')
      .in('question_id', questions.map(q => q.id))
      .eq('is_correct', true)

    const correctMap: Record<string, string> = {}
    correctAnswers?.forEach(a => {
      correctMap[a.question_id] = a.id
    })

    let correctCount = 0
    questions.forEach(q => {
      if (selected[q.id] === correctMap[q.id]) {
        correctCount++
      }
    })

    const score = Math.round((correctCount / questions.length) * 100)
    const passed = score >= passScore

    const { data: attempt } = await supabase
      .from('exam_attempts')
      .insert({
        user_id: user.id,
        exam_id: examId,
        score,
        passed,
      })
      .select()
      .single()

if (passed && attempt) {
      // Fetch the user's name to store directly on the certificate
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      await supabase.from('certificates').insert({
        user_id: user.id,
        course_id: courseId,
        exam_attempt_id: attempt.id,
        recipient_name: profile?.full_name ?? '',
      })
    }

    setResult({ score, passed, correctCount, total: questions.length })
    setSubmitting(false)
  }

  if (result) {
    return (
      <div className={`rounded-xl border p-8 text-center ${
        result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
      }`}>
        <div className="text-5xl mb-4">{result.passed ? '🎉' : '😔'}</div>
        <h2 className={`text-lg font-bold mb-2 ${
          result.passed ? 'text-green-800' : 'text-red-800'
        }`}>
          {result.passed ? 'You passed!' : 'Not quite'}
        </h2>
        <p className={`text-lg mb-1 ${
          result.passed ? 'text-green-700' : 'text-red-700'
        }`}>
          Your score: <strong>{result.score}%</strong>
        </p>
        <p className={`text-sm mb-6 ${
          result.passed ? 'text-green-600' : 'text-red-600'
        }`}>
          {result.correctCount} out of {result.total} correct · Pass mark: {passScore}%
        </p>

        {result.passed ? (
          <Button onClick={() => router.push('/dashboard')}>
            View your certificate →
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-600">
              Review the course material and try again.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push(`/training/${courseSlug}`)}>
              Back to course
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {questions.map((question, index) => (
        <div key={question.id} className="bg-card rounded-xl border p-6">
          <p className="font-semibold text-foreground mb-4">
            {index + 1}. {question.question_text}
          </p>
          <div className="space-y-2">
            {question.answers.map(answer => (
              <label
                key={answer.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                  ${selected[question.id] === answer.id
                    ? 'border-foreground bg-muted'
                    : 'border-border hover:bg-muted'
                  }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={answer.id}
                  checked={selected[question.id] === answer.id}
                  onChange={() => setSelected(prev => ({
                    ...prev,
                    [question.id]: answer.id
                  }))}
                  className="accent-foreground"
                />
                <span className="text-foreground">{answer.answer_text}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="text-sm text-muted-foreground text-center">
        {Object.keys(selected).length} of {questions.length} questions answered
      </div>

      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={!allAnswered || submitting}
      >
        {submitting
          ? 'Submitting...'
          : !allAnswered
          ? 'Answer all questions to submit'
          : 'Submit exam'
        }
      </Button>
    </div>
  )
}