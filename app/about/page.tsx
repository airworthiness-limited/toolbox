import { AdPlaceholder } from '@/components/ad-placeholder'

export default function AboutPage() {
  return (
    <div className="min-h-screen">

      {/* Hero */}
      <section className="aw-gradient py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-5xl text-white leading-tight tracking-tight">
            About Airworthiness
          </h1>
          <p className="text-white/40 text-sm tracking-[0.3em] uppercase mt-3">Limited</p>
          <p className="text-lg lg:text-xl text-white/70 max-w-2xl mx-auto mt-6 leading-relaxed">
            Building the digital infrastructure the aviation engineering profession needs but has never had.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

            {/* Mission */}
            <div className="border-l-4 border-[#2d3a80] pl-6">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  The aviation engineering industry relies on methods, practices and technology that have not meaningfully changed in decades. Training is treated as a tick-box exercise. Consultants are employed with little appreciation of the interconnection of safety requirements. Logbooks are still paper. The profession deserves better tools, and with your trust, we intend to build them.
                </p>
                <p>
                  Airworthiness Limited exists to change that. We are building the digital infrastructure that the profession needs but has never had: tools that make record-keeping effortless, training without the financial barrier, and career development records that are transferrable.
                </p>
                <p>
                  We believe that where possible, safety should not come at unnecessary cost, and that engineers should receive the recognition their work deserves.
                </p>
              </div>
            </div>

            {/* Vision */}
            <div className="border-l-4 border-[#2d3a80] pl-6">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">Our Vision</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  We want to digitise the Aircraft Maintenance Licence process. Not to replace what works, but to bring it into the century it belongs in. There will always be an option to print your logbook for a physical signature, but through our trusted user privileges for licensed engineers, we can do what paper cannot: verify, share, and build on your professional record with confidence.
                </p>
                <p>
                  We are starting in the United Kingdom and intend to support aviation engineering professionals across Europe. Each regulator has its own requirements, expectations and culture, and we will take the time to understand them properly before expanding. We are also mindful that digital systems must be designed to resist fraud, because when one person's credentials cannot be trusted, everyone suffers.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4">
        <AdPlaceholder format="banner" className="my-0" />
      </div>

      {/* Values */}
      <section className="bg-gray-950 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4 text-center">Our Values</h2>
          <p className="text-white/50 text-center mb-12 max-w-xl mx-auto">
            The principles that guide how we build, advise, and operate.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <div className="w-10 h-10 rounded-lg bg-[#2d3a80]/30 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Free for professionals, forever</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                We mean this literally. The platform is funded by advertising. If you would prefer not to see adverts, we offer a small payment to remove them. That is the entire model. There is no premium tier that locks features behind a paywall, no trial period, no catch.
              </p>
              <p className="text-white/60 text-sm leading-relaxed mt-3">
                That is what we mean when we say Airworthiness for Everyone.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <div className="w-10 h-10 rounded-lg bg-[#2d3a80]/30 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Compliance is safety</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                We do not treat regulatory compliance as paperwork to be tolerated. Every requirement exists because something went wrong. When we build tools or advise organisations, we start from that principle.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <div className="w-10 h-10 rounded-lg bg-[#2d3a80]/30 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Independence and trust</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Our platform is not owned by, funded by, or affiliated with any training provider, maintenance organisation, or regulator. The data you enter belongs to you. The advice we give to organisations is honest because we have nothing to sell them except the truth.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <div className="w-10 h-10 rounded-lg bg-[#2d3a80]/30 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Earned authority</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                We do not ask for your trust. We earn it through transparent systems, verifiable records, and professional standards that hold up to scrutiny. Every verification on our platform is traceable to a named, licensed individual.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Consultancy */}
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">Consultancy</h2>
          <div className="space-y-4 text-gray-600 leading-relaxed mb-10">
            <p>
              While our professional tools grow through organic adoption, we offer tailored consultancy to airworthiness organisations. We provide an independent audit service as required by the initial and continuing airworthiness regulations, but we go further than a checklist. We explain your strengths and weaknesses with the thinking and logic of a regulator, so that organisations understand not just what needs to change, but why.
            </p>
            <p>
              Our advisory work covers safety review boards and action groups, finding response plans and nominated personnel coaching. We work with organisations that are approved, seeking approval, or subcontracting or supplying to approved organisations.
            </p>
            <p>
              We measure the value of our work by one thing: whether an organisation's safety culture is stronger after our involvement. Not whether we delivered a report, attended a meeting, or satisfied an audit. Stronger culture, fewer findings, better outcomes. That is the standard we hold ourselves to, and it is the standard our clients should expect.
            </p>
          </div>

          {/* CTA Card */}
          <div className="aw-gradient rounded-2xl p-8 lg:p-10 text-center">
            <h3 className="text-xl lg:text-2xl font-bold text-white mb-3">
              Work with us
            </h3>
            <p className="text-white/70 max-w-lg mx-auto mb-6">
              Whether you are seeking approval, maintaining one, or building your safety culture from the ground up, we would welcome the conversation.
            </p>
            <a href="mailto:contact@airworthiness.org.uk">
              <button className="bg-white text-[#2d3a80] font-bold px-8 py-3 rounded-lg hover:bg-white/90 transition-colors">
                Contact us
              </button>
            </a>
            <p className="text-white/40 text-xs mt-3">contact@airworthiness.org.uk</p>
          </div>
        </div>
      </section>

    </div>
  )
}
