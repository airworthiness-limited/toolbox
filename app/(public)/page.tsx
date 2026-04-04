import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SignUpForm } from '@/components/signup-form'

export const metadata: Metadata = {
  title: 'Airworthiness | Free Tools for Aviation Engineers',
  description: 'Free digital logbook, continuation training, module tracking, and competency assessment for UK Aircraft Maintenance Licence holders.',
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen">

      {/* Hero with sign-up form */}
      <section className="py-20 lg:py-32">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h1 className="text-2xl font-semibold text-foreground leading-tight">
            Your experience,<br />
            organised.
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mt-4 mx-auto max-w-lg">
            Free tools for aviation engineering professionals. Digital logbook, continuation training, module tracking, and more.
          </p>
          <div className="mt-8 max-w-sm mx-auto">
            <SignUpForm />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-lg font-semibold text-foreground text-center mb-12">
            Everything an aviation engineer needs. Free.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Continuation Training</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Human Factors, EWIS, and Fuel Tank Safety. Complete the course, pass the exam, receive a verifiable certificate.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Digital Logbook</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Record maintenance tasks in the format required by the Civil Aviation Authority. Build recency for licence applications.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Module Tracker</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Track your Part 66 module exam progress across all categories. Upload certificates and monitor expiry dates.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Competency Assessment</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Practise core maintenance knowledge questions covering human factors, procedures, and regulations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Consultancy */}
      <section className="border-t border-border py-16 lg:py-24 bg-muted">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Consultancy for organisations
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10">
            We work with initial and continuing airworthiness organisations. Independent audits,
            safety advisory, crisis management, and nominated personnel coaching.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            <div className="bg-card rounded-xl border p-5">
              <h3 className="text-sm font-semibold text-foreground mb-1">Independent Audits</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Part 145, Part 147, Part 21G, and Part CAMO compliance audits.
              </p>
            </div>
            <div className="bg-card rounded-xl border p-5">
              <h3 className="text-sm font-semibold text-foreground mb-1">Safety Advisory</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Safety Review Boards, Safety Action Groups, and management system advisory.
              </p>
            </div>
            <div className="bg-card rounded-xl border p-5">
              <h3 className="text-sm font-semibold text-foreground mb-1">Crisis Management</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Level 1 Response Plans and crisis management capability development.
              </p>
            </div>
            <div className="bg-card rounded-xl border p-5">
              <h3 className="text-sm font-semibold text-foreground mb-1">Personnel Coaching</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Preparing nominated personnel for CAA acceptance interviews.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <a href="mailto:contact@airworthiness.org.uk" className="text-sm font-semibold text-primary hover:underline">
              contact@airworthiness.org.uk
            </a>
          </div>
        </div>
      </section>

    </div>
  )
}
