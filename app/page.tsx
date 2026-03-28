import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/profile')

  return (
    <div className="min-h-screen">

      {/* Hero */}
      <section className="aw-gradient py-20 lg:py-28">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-5xl lg:text-6xl text-white leading-tight tracking-tight">
            Airworthiness
          </h1>
          <p className="text-white/40 text-sm tracking-[0.3em] uppercase mt-2 mb-6">Limited</p>
          <p className="text-xl lg:text-2xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            The UK platform for aircraft maintenance professionals and approved organisations.
          </p>
        </div>
      </section>

      {/* Two columns */}
      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

            {/* Professionals */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="aw-gradient p-8 lg:p-10">
                <h2 className="text-3xl text-white tracking-tight">
                  Airworthiness
                </h2>
                <p className="text-white/60 text-lg mt-1">for Professionals</p>
                <div className="mt-4 inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/30 uppercase tracking-wider">
                  Completely Free
                </div>
              </div>

              <div className="p-8 lg:p-10">
                <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                  All professional tools are free to use. Airworthiness is a data platform built to support
                  UK licence holders throughout their career — from first module to type rating endorsement.
                </p>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#2d3a80]/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[#2d3a80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Continuation Training</h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Human Factors, Electrical Wiring Interconnection System (EWIS), and Fuel Tank Safety.
                        Complete the course, pass the exam, and receive a verifiable certificate.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#2d3a80]/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[#2d3a80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Digital Logbook</h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Record your maintenance tasks in the CAA-required format. Build recency for licence
                        applications and renewals. Tasks can be electronically verified or printed.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#2d3a80]/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[#2d3a80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Module Tracker</h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Working towards your Aircraft Maintenance Licence? Track your Part 66 module exam
                        progress, upload certificates, and monitor expiry dates across all categories.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#2d3a80]/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[#2d3a80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Competency Assessment</h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Practise core maintenance knowledge questions before being issued an authorisation
                        by your organisation. Covers human factors, maintenance procedures, and regulations.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <Link href="/signup">
                    <Button className="w-full bg-[#2d3a80] text-white hover:bg-[#232e66] h-12 font-semibold">
                      Create your free account
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Organisations */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-950 p-8 lg:p-10">
                <h2 className="text-3xl text-white tracking-tight">
                  Airworthiness
                </h2>
                <p className="text-white/60 text-lg mt-1">for Organisations</p>
                <div className="mt-4 inline-block bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20 uppercase tracking-wider">
                  Tailored Consultancy
                </div>
              </div>

              <div className="p-8 lg:p-10">
                <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                  Expert consultancy from a former UK CAA regulator. We work with approved organisations
                  to strengthen compliance, prepare for oversight, and build safety culture at every level.
                </p>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-900/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Independent Audits</h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Independent compliance audits for Aircraft, Engine and Component Maintenance Organisation
                        Approvals (Part 145), Aircraft Maintenance Training Organisation Approvals (Part 147),
                        Production Organisation Approvals (Part 21G), and Continuing Airworthiness Management
                        Organisation Approvals (Part CAMO).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-900/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Safety Advisory Services</h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Expert safety advisory in a capacity similar to a non-executive director or independent
                        committee member. Attend Safety Review Boards for senior leadership and Safety Action
                        Groups at the local level, strengthening your Safety Management System from the ground up.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-900/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Crisis Management</h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Level 1 Response Plan development and crisis management support. Be prepared when
                        the regulator, the AAIB, or the media come calling. We help you build response
                        capability before you need it.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-900/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Nominated Personnel Coaching</h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Preparing your Compliance Monitoring Manager, Safety Manager, Quality Manager, or
                        other nominated personnel for CAA acceptance interviews. Covering Part 145, Part 147,
                        Part CAMO, and Part 21G approvals. From an ex-regulator who knows what the CAA
                        expects and how to manage that relationship effectively.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <a href="mailto:contact@airworthiness.org.uk">
                    <Button variant="outline" className="w-full h-12 font-semibold border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white">
                      Contact us for a quote
                    </Button>
                  </a>
                  <p className="text-[11px] text-gray-400 text-center mt-3">
                    contact@airworthiness.org.uk
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  )
}
