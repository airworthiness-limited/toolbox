import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 py-24 text-center">
        <span className="inline-block bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1 rounded-full mb-6">
          Professional Certification Platform
        </span>
        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
          Learn. Pass the exam.
          <br />
          Earn your certificate.
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Study industry-relevant courses, prove your knowledge with a proctored exam,
          and receive a verifiable certificate you can share with employers.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg">Get started free →</Button>
          </Link>
          <Link href="/courses">
            <Button size="lg" variant="outline">Browse courses</Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
            Everything you need to get certified
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                icon: '📚',
                title: 'Expert-written courses',
                description: 'Text-based modules written by professionals, structured for real learning.',
              },
              {
                icon: '📝',
                title: 'Rigorous MCQ exams',
                description: 'Timed multiple-choice exams with a minimum pass score to ensure you\'ve mastered the material.',
              },
              {
                icon: '🏆',
                title: 'Verifiable certificates',
                description: 'Every certificate has a unique URL. Anyone can verify it\'s real in seconds.',
              },
            ].map(feature => (
              <div key={feature.title} className="bg-white rounded-xl border p-6">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Ready to get certified?
        </h2>
        <p className="text-gray-500 mb-8">
          Join professionals already using the platform. Start with a free course today.
        </p>
        <Link href="/signup">
          <Button size="lg">Create your free account →</Button>
        </Link>
      </section>

    </div>
  )
}