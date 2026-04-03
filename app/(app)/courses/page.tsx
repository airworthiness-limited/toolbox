import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Continuation Training</h1>
        <p className="text-sm text-gray-500 mt-1">Browse professional learning courses</p>
      </div>

      {courses && courses.length > 0 && (
        <div className="space-y-2 mb-10">
          {courses.map(course => (
            <Link key={course.id} href={`/courses/${course.slug}`}>
              <div className="flex items-center justify-between px-4 py-3.5 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">{course.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{course.description}</p>
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
        <h2 className="text-lg font-semibold text-gray-900 tracking-tight">In Development</h2>
        <p className="text-xs text-gray-400 mt-1">Continuation training courses coming soon</p>
      </div>

      <div className="space-y-1">
        {continuationTraining.map(title => (
          <div key={title} className="flex items-center justify-between px-4 py-3 rounded-lg">
            <p className="text-sm text-gray-400">{title}</p>
            <span className="text-xs text-gray-300 font-medium">Coming soon</span>
          </div>
        ))}
      </div>
    </div>
  )
}
