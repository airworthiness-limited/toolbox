export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { queryOne } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AssessmentForm } from './assessment-form'

export default async function AssessmentPage() {
  const session = await auth()
  const user = session?.user
  if (!user) redirect('/login')

  // Check if already passed
  const profile = await queryOne<{ competency_completed_at: string | null }>(
    'SELECT competency_completed_at FROM profiles WHERE id = $1',
    [user.id]
  )

  if (profile?.competency_completed_at) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen aw-gradient">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Competency Assessment</CardTitle>
            <CardDescription>
              Answer 10 questions to demonstrate your core aircraft maintenance knowledge.
              You need at least 80% (8/10) to pass. This assessment allows you to list
              your profile publicly for recruiters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AssessmentForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
