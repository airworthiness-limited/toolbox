export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16">

        {/* Mission */}
        <section className="mb-16">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h1>
          <div className="space-y-4 text-gray-700 leading-relaxed">
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
        </section>

        {/* Vision */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Vision</h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              We want to digitise the Aircraft Maintenance Licence process. Not to replace what works, but to bring it into the century it belongs in. There will always be an option to print your logbook for a physical signature, but through our trusted user privileges for licensed engineers, we can do what paper cannot: verify, share, and build on your professional record with confidence.
            </p>
            <p>
              We are starting in the United Kingdom and intend to support aviation engineering professionals across Europe. Each regulator has its own requirements, expectations and culture, and we will take the time to understand them properly before expanding. We are also mindful that digital systems must be designed to resist fraud, because when one person's credentials cannot be trusted, everyone suffers.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Values</h2>

          <div className="space-y-10">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Free for professionals, forever</h3>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  We mean this literally. The platform is funded by advertising. If you would prefer not to see adverts, we offer a small monthly subscription to remove them. That is the entire model. There is no premium tier that locks features behind a paywall, no trial period, no catch.
                </p>
                <p>
                  Whether you are building your range of tasks towards your first licence category, accumulating hours for a type rating, or moving between seasonal base and line maintenance contracts, every tool on this platform works the same for every user. You might even be in engine or component maintenance with limited room for growth, but if you take your digital logbook with you, you can find the recognition and progression you are looking for.
                </p>
                <p>
                  That is what we mean when we say Airworthiness for Everyone.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Compliance is safety</h3>
              <p className="text-gray-700 leading-relaxed">
                We do not treat regulatory compliance as paperwork to be tolerated. Every requirement exists because something went wrong. When we build tools or advise organisations, we start from that principle.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Independence and trust</h3>
              <p className="text-gray-700 leading-relaxed">
                Our platform is not owned by, funded by, or affiliated with any training provider, maintenance organisation, or regulator. The data you enter belongs to you. The advice we give to organisations is honest because we have nothing to sell them except the truth.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Earned authority</h3>
              <p className="text-gray-700 leading-relaxed">
                We do not ask for your trust. We earn it through transparent systems, verifiable records, and professional standards that hold up to scrutiny. Every verification on our platform is traceable to a named, licensed individual.
              </p>
            </div>
          </div>
        </section>

        {/* Consultancy */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Consultancy</h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
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
        </section>

      </div>
    </div>
  )
}
