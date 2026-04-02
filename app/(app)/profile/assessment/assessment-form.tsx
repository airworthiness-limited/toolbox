'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { COMPETENCY_QUESTIONS, COMPETENCY_PASS_SCORE } from '@/lib/profile/constants'

export function AssessmentForm() {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [passed, setPassed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function selectAnswer(questionId: string, optionIndex: number) {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }))
  }

  async function handleSubmit() {
    // Check all questions answered
    if (Object.keys(answers).length < COMPETENCY_QUESTIONS.length) {
      setError('Please answer all questions before submitting.')
      return
    }

    setLoading(true)
    setError('')

    // Calculate score
    let correct = 0
    COMPETENCY_QUESTIONS.forEach(q => {
      if (answers[q.id] === q.correctIndex) {
        correct++
      }
    })

    const percentage = (correct / COMPETENCY_QUESTIONS.length) * 100
    const didPass = percentage >= COMPETENCY_PASS_SCORE

    setScore(correct)
    setPassed(didPass)
    setSubmitted(true)

    if (didPass) {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Save responses
      const responses = COMPETENCY_QUESTIONS.map(q => ({
        user_id: user.id,
        question_id: q.id,
        answer: q.options[answers[q.id]],
      }))

      await supabase.from('competency_responses').insert(responses)

      // Mark competency as completed on profile
      await supabase
        .from('profiles')
        .update({ competency_completed_at: new Date().toISOString() })
        .eq('id', user.id)
    }

    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">{passed ? '🎉' : '😞'}</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {passed ? 'Assessment Passed!' : 'Not quite there'}
        </h2>
        <p className="text-gray-500 mb-2">
          You scored {score} out of {COMPETENCY_QUESTIONS.length} ({Math.round((score / COMPETENCY_QUESTIONS.length) * 100)}%)
        </p>
        <p className="text-sm text-gray-400 mb-6">
          {passed
            ? 'You can now list your profile publicly for recruiters.'
            : `You need at least ${COMPETENCY_PASS_SCORE}% to pass. Review the questions below and try again.`}
        </p>

        {/* Show correct/incorrect answers */}
        <div className="text-left space-y-4 mt-6 border-t pt-6">
          {COMPETENCY_QUESTIONS.map((q, qi) => {
            const userAnswer = answers[q.id]
            const isCorrect = userAnswer === q.correctIndex
            return (
              <div key={q.id} className={`p-4 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <p className="font-medium text-gray-900 text-sm mb-1">
                  {qi + 1}. {q.question}
                </p>
                <p className="text-sm">
                  {isCorrect ? (
                    <span className="text-green-700">✓ {q.options[userAnswer]}</span>
                  ) : (
                    <>
                      <span className="text-red-700 line-through">{q.options[userAnswer]}</span>
                      <br />
                      <span className="text-green-700">✓ {q.options[q.correctIndex]}</span>
                    </>
                  )}
                </p>
              </div>
            )
          })}
        </div>

        <div className="mt-6">
          {passed ? (
            <Button onClick={() => router.push('/profile')}>
              Back to Profile →
            </Button>
          ) : (
            <Button onClick={() => { setSubmitted(false); setAnswers({}) }}>
              Try Again
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-8">
        {COMPETENCY_QUESTIONS.map((q, qi) => (
          <div key={q.id}>
            <p className="font-medium text-gray-900 mb-3">
              {qi + 1}. {q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((option, oi) => (
                <button
                  key={oi}
                  type="button"
                  onClick={() => selectAnswer(q.id, oi)}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                    answers[q.id] === oi
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 mt-4">{error}</p>
      )}

      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm text-gray-400">
          {Object.keys(answers).length} of {COMPETENCY_QUESTIONS.length} answered
        </p>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Assessment'}
        </Button>
      </div>
    </div>
  )
}
