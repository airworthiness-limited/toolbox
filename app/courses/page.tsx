import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function CoursesPage() {
  const supabase = await createClient()

  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  const continuationTraining = [
    'Safety Training (Including Human Factors)',
    'Electrical Wiring Interconnection System (EWIS)',
    'Critical Design Configuration Control Limitations (CDCCL)',
    'Fuel Tank Safety (SFAR 88)',
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">All Courses</h1>
          <p className="text-gray-500 mt-2">Browse our professional learning courses</p>
        </div>

        {courses && courses.length > 0 && (
          <div className="grid gap-4 mb-12">
            {courses.map(course => (
              <Link key={course.id} href={`/courses/${course.slug}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      {course.is_premium && (
                        <Badge variant="secondary">Premium</Badge>
                      )}
                    </div>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* In Development Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">In Development</h2>
        </div>

        {/* Continuation Training */}
        <div className="mb-10">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Continuation Training</h3>
          <div className="grid gap-3">
            {continuationTraining.map(title => (
              <Card key={title} className="opacity-60">
                <CardHeader className="py-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{title}</CardTitle>
                    <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}