export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: 28 March 2026</p>

        <div className="prose prose-gray prose-sm max-w-none space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">1. Introduction</h2>
            <p>These Terms of Service ("Terms") govern your use of the Airworthiness Limited website at airworthiness.org.uk ("the Service"). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, you must not use the Service.</p>
            <p>Airworthiness Limited is a company registered in England and Wales.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">2. Eligibility</h2>
            <p>You must be at least 18 years old to create an account. By registering, you represent that the information you provide is accurate and complete.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">3. Account Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must not share your account with others.</li>
              <li>You must notify us immediately of any unauthorised access.</li>
              <li>All information submitted to the platform, including licence details and logbook entries, must be truthful and accurate.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">4. Licence Verification</h2>
            <p>Airworthiness Limited provides a licence verification service to establish trust between users. Verification is performed by our administrators and does not constitute an endorsement by the UK Civil Aviation Authority. We verify the documentation provided by users but cannot guarantee the authenticity of all submitted documents.</p>
            <p>Verified licence holders may interact with other users on a consent basis. The licence verification is required for certain trust privileges on the platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Submit false or misleading licence information.</li>
              <li>Use the platform to misrepresent your qualifications or certifications.</li>
              <li>Upload harmful, offensive, or illegal content.</li>
              <li>Attempt to gain unauthorised access to other users' accounts or data.</li>
              <li>Use automated tools to scrape or extract data from the Service.</li>
              <li>Interfere with the operation or security of the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">6. Digital Logbook</h2>
            <p>The digital logbook provided by Airworthiness Limited is a supplementary tool for recording maintenance tasks. It does not replace the official record-keeping requirements mandated by the UK CAA or any approved maintenance organisation. Users are responsible for ensuring compliance with all applicable regulatory requirements.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">7. Continuation Training</h2>
            <p>Courses and certificates provided through the platform are for continuing professional development purposes. Users should verify with their employer or the CAA whether specific training meets regulatory requirements for their role.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">8. Intellectual Property</h2>
            <p>All content, design, and functionality of the Service is owned by Airworthiness Limited and protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without our written permission.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">9. Limitation of Liability</h2>
            <p>The Service is provided "as is" without warranties of any kind. Airworthiness Limited shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service. Our total liability shall not exceed the amount you have paid to us in the 12 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">10. Account Deletion</h2>
            <p>You may delete your account at any time from your profile page. Upon deletion, your personal data will be permanently removed in accordance with our Privacy Policy. Some data may be retained where required by law.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">11. Termination</h2>
            <p>We reserve the right to suspend or terminate your account if you breach these Terms or engage in conduct that we consider harmful to the Service or other users.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">12. Governing Law</h2>
            <p>These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">13. Changes</h2>
            <p>We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the revised Terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">14. Contact</h2>
            <p>For questions about these Terms, contact us at <a href="mailto:contact@airworthiness.org.uk" className="text-[#1565C0] hover:underline">contact@airworthiness.org.uk</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
