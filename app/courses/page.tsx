import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AdPlaceholder } from '@/components/ad-placeholder'

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
    <div className="min-h-screen aw-gradient">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl text-white">All Courses</h1>
          <p className="text-white/60 mt-2">Browse our professional learning courses</p>
        </div>

        {courses && courses.length > 0 && (
          <div className="grid gap-4 mb-12">
            {courses.map(course => (
              <Link key={course.id} href={`/courses/${course.slug}`}>
                <Card className="bg-white hover:shadow-md transition-shadow cursor-pointer">
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

        <AdPlaceholder format="inline" className="my-6" />

        {/* In Development Section */}
        <div className="mb-8">
          <h2 className="text-2xl text-white">In Development</h2>
        </div>

        {/* Continuation Training */}
        <div className="mb-10">
          <h3 className="text-lg text-white/80 mb-4">Continuation Training</h3>
          <div className="grid gap-3">
            {continuationTraining.map(title => (
              <Card key={title} className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardHeader className="py-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-white/70">{title}</CardTitle>
                    <Badge variant="outline" className="text-xs bg-transparent border-white/30 text-white/60">Coming Soon</Badge>
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
