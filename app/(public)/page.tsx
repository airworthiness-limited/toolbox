import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SignUpForm } from '@/components/signup-form'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/profile')

  return (
    <div className="min-h-screen">

      {/* Hero with sign-up form */}
      <section className="py-24 lg:py-40">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight">
            Your experience,<br />
            organised.
          </h1>
          <p className="text-xl text-gray-500 leading-relaxed mt-8 mx-auto max-w-lg">
            Free tools for aviation engineering professionals. Digital logbook, continuation training, module tracking, and more.
          </p>
          <div className="mt-10 max-w-sm mx-auto">
            <SignUpForm />
          </div>
        </div>
      </section>

      {/* Features — simple, no icons */}
      <section className="border-t border-gray-100 py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight text-center mb-16">
            Everything an aviation engineer needs. Free.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Continuation Training</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Human Factors, EWIS, and Fuel Tank Safety. Complete the course, pass the exam, receive a verifiable certificate.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Digital Logbook</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Record maintenance tasks in the format required by the Civil Aviation Authority. Build recency for licence applications.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Module Tracker</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Track your Part 66 module exam progress across all categories. Upload certificates and monitor expiry dates.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Competency Assessment</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Practise core maintenance knowledge questions covering human factors, procedures, and regulations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Consultancy */}
      <section className="border-t border-gray-100 py-20 lg:py-28 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-4">
            Consultancy for organisations
          </h2>
          <p className="text-sm text-gray-500 max-w-xl mx-auto leading-relaxed mb-12">
            We work with initial and continuing airworthiness organisations. Independent audits,
            safety advisory, crisis management, and nominated personnel coaching.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-2xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Independent Audits</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Part 145, Part 147, Part 21G, and Part CAMO compliance audits.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Safety Advisory</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Safety Review Boards, Safety Action Groups, and management system advisory.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Crisis Management</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Level 1 Response Plans and crisis management capability development.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Personnel Coaching</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Preparing nominated personnel for CAA acceptance interviews.
              </p>
            </div>
          </div>

          <div className="mt-10">
            <a href="mailto:contact@airworthiness.org.uk" className="text-sm font-semibold text-[#123456] hover:underline">
              contact@airworthiness.org.uk
            </a>
          </div>
        </div>
      </section>

    </div>
  )
}
