import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AssessmentForm } from './assessment-form'

export default async function AssessmentPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check if already passed
  const { data: profile } = await supabase
    .from('profiles')
    .select('competency_completed_at')
    .eq('id', user.id)
    .single()

  if (profile?.competency_completed_at) {
    redirect('/profile')
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
