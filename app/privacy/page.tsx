export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: 28 March 2026</p>

        <div className="prose prose-gray prose-sm max-w-none space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">1. Who We Are</h2>
            <p>Airworthiness Limited ("we", "us", "our") operates the website airworthiness.org.uk. We are the data controller responsible for your personal data under the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.</p>
            <p>Contact: <a href="mailto:contact@airworthiness.org.uk" className="text-[#2d3a80] hover:underline">contact@airworthiness.org.uk</a></p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">2. Data We Collect</h2>
            <p>We collect the following categories of personal data:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Identity data:</strong> first name, middle name(s), last name.</li>
              <li><strong>Contact data:</strong> email address.</li>
              <li><strong>Licence data:</strong> UK CAA Aircraft Maintenance Licence reference number, licence categories held, aircraft type endorsements and dates, photographs of your licence document.</li>
              <li><strong>Professional data:</strong> maintenance logbook entries (task descriptions, dates, aircraft details, verification records), module exam progress, continuation training certificates.</li>
              <li><strong>Technical data:</strong> IP address, browser type, device information, pages visited, collected automatically via cookies and similar technologies.</li>
              <li><strong>Account data:</strong> authentication credentials (encrypted), account preferences.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">3. How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To create and manage your account.</li>
              <li>To provide licence tracking, digital logbook, and training management services.</li>
              <li>To verify licence holder status for trust privileges on the platform (consent-based).</li>
              <li>To enable licence-verified professionals to interact with other users.</li>
              <li>To display relevant advertisements via Google AdSense.</li>
              <li>To analyse website usage and improve our services.</li>
              <li>To comply with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">4. Lawful Basis for Processing</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Consent:</strong> for licence verification, interactions with other users, marketing communications, and non-essential cookies.</li>
              <li><strong>Contract:</strong> processing necessary to provide our services to you as a registered user.</li>
              <li><strong>Legitimate interests:</strong> website security, fraud prevention, service improvement, and analytics.</li>
              <li><strong>Legal obligation:</strong> where required by UK law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">5. How We Store Your Data</h2>
            <p>Your data is stored securely using Supabase (hosted within the EU/EEA) with encryption at rest and in transit. File uploads (licence photographs, certificates) are stored in Supabase Storage with row-level security policies. The website is served via Vercel.</p>
            <p>We retain your personal data for as long as your account is active. If you delete your account, your data will be permanently removed within 30 days, except where retention is required by law.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">6. Third-Party Services</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Supabase:</strong> database hosting, authentication, and file storage.</li>
              <li><strong>Vercel:</strong> website hosting and content delivery.</li>
              <li><strong>Google AdSense:</strong> advertising (may use cookies to serve personalised ads).</li>
              <li><strong>Social login providers:</strong> Google, Apple, and Facebook (when used for authentication).</li>
            </ul>
            <p>We do not sell your personal data to third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">7. Your Rights Under UK GDPR</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Access</strong> your personal data.</li>
              <li><strong>Rectify</strong> inaccurate or incomplete data.</li>
              <li><strong>Erase</strong> your data ("right to be forgotten"); you can delete your account from your profile page.</li>
              <li><strong>Restrict</strong> processing of your data.</li>
              <li><strong>Data portability</strong>, receive your data in a structured, machine-readable format.</li>
              <li><strong>Object</strong> to processing based on legitimate interests.</li>
              <li><strong>Withdraw consent</strong> at any time where consent is the lawful basis.</li>
            </ul>
            <p>To exercise any of these rights, contact us at <a href="mailto:contact@airworthiness.org.uk" className="text-[#2d3a80] hover:underline">contact@airworthiness.org.uk</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">8. Cookies</h2>
            <p>We use cookies and similar technologies. For full details, see our <a href="/cookies" className="text-[#2d3a80] hover:underline">Cookie Policy</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">9. Complaints</h2>
            <p>If you believe we have not handled your data correctly, you have the right to lodge a complaint with the Information Commissioner's Office (ICO) at <a href="https://ico.org.uk" className="text-[#2d3a80] hover:underline" target="_blank" rel="noopener noreferrer">ico.org.uk</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">10. Changes to This Policy</h2>
            <p>We may update this policy from time to time. Changes will be posted on this page with an updated revision date.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
