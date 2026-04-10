export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SignUpForm } from '@/components/signup-form'

export const metadata: Metadata = {
  title: 'Airworthiness | Free Tools for Aviation Engineers',
  description: 'Digital logbook, continuation training, module tracking, and competency assessment for UK Aircraft Maintenance Licence holders.',
}

export default async function HomePage() {
  const session = await auth()
  const user = session?.user

  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen">

      {/* Hero */}
      <section className="py-24 lg:py-40">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight leading-tight">
            Your experience,<br />
            organised.
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed mt-5 mx-auto max-w-md">
            Free tools for aviation engineering professionals. Track your training, log your experience, and manage your career.
          </p>
          <div className="mt-10 max-w-sm mx-auto">
            <SignUpForm />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-xl font-semibold text-foreground text-center mb-4">
            Everything you need
          </h2>
          <p className="text-sm text-muted-foreground text-center max-w-lg mx-auto mb-14">
            Purpose-built for Part 66 licence holders and aircraft maintenance engineers.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">Digital Logbook</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Record maintenance tasks in the format required by the Civil Aviation Authority. Build recency for licence applications.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">Continuation Training</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Human Factors, EWIS, and Fuel Tank Safety. Complete the course, pass the exam, receive a verifiable certificate.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">Module Tracker</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Track your Part 66 module exam progress across all categories. Upload certificates and monitor expiry dates.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">Competency Assessment</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Practise core maintenance knowledge covering human factors, procedures, and regulations.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">Feed</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Connect with aviation engineering professionals. Share updates, follow colleagues, and stay current.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">
                <a href="/market" className="hover:underline">Market</a>
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Search 1,500+ Part 145 approved maintenance organisations. Ratings, capabilities, and locations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Consultancy */}
      <section className="border-t border-border py-20 lg:py-28 bg-muted">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Consultancy
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed mb-14">
            We work with initial and continuing airworthiness organisations. Independent support for compliance, safety, and people.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-3xl mx-auto">
            <div className="bg-card rounded-xl border p-6">
              <h3 className="text-sm font-semibold text-foreground mb-2">Independent Audit & Compliance Monitoring</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Part 21G, Part 145, Part 147, and Part CAMO organisations.
              </p>
            </div>
            <div className="bg-card rounded-xl border p-6">
              <h3 className="text-sm font-semibold text-foreground mb-2">Safety Advisory</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Safety Review Boards and Safety Action Groups.
              </p>
            </div>
            <div className="bg-card rounded-xl border p-6">
              <h3 className="text-sm font-semibold text-foreground mb-2">Findings & Occurrence Management</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Containment and corrective action, root cause analysis, and preventive action.
              </p>
            </div>
            <div className="bg-card rounded-xl border p-6">
              <h3 className="text-sm font-semibold text-foreground mb-2">Nominated Personnel Coaching</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Preparing and mentoring nominated personnel for CAA acceptance.
              </p>
            </div>
          </div>

          <div className="mt-10">
            <a href="mailto:contact@airworthiness.org.uk" className="text-sm font-semibold text-primary hover:underline">
              contact@airworthiness.org.uk
            </a>
          </div>
        </div>
      </section>

    </div>
  )
}
