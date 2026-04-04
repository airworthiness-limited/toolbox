import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'Continuation Training | Airworthiness' }

export default async function CoursesPage() {
  const supabase = await createClient()

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, slug, description, is_premium')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  const continuationTraining = [
    'Safety Training (Including Human Factors)',
    'Electrical Wiring Interconnection System (EWIS)',
    'Critical Design Configuration Control Limitations (CDCCL)',
    'Fuel Tank Safety (SFAR 88)',
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Continuation Training</h1>
        <p className="text-sm text-muted-foreground mt-1">Browse professional learning courses</p>
      </div>

      {courses && courses.length > 0 && (
        <div className="space-y-2 mb-10">
          {courses.map(course => (
            <Link key={course.id} href={`/training/${course.slug}`}>
              <div className="flex items-center justify-between px-4 py-3.5 rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">{course.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{course.description}</p>
                </div>
                {course.is_premium && (
                  <Badge variant="secondary" className="text-xs">Premium</Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}


      <div className="mb-8">
        <h2 className="text-lg font-bold text-foreground">In Development</h2>
        <p className="text-xs text-muted-foreground mt-1">Continuation training courses coming soon</p>
      </div>

      <div className="space-y-1">
        {continuationTraining.map(title => (
          <div key={title} className="flex items-center justify-between px-4 py-3 rounded-lg">
            <p className="text-sm text-muted-foreground">{title}</p>
            <span className="text-xs text-muted-foreground/60 font-medium">Coming soon</span>
          </div>
        ))}
      </div>
    </div>
  )
}
