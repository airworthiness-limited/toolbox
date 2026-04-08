import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacy Policy | Airworthiness' }

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: 7 April 2026</p>

        <div className="prose prose-gray prose-sm max-w-none space-y-6 text-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">1. Who We Are</h2>
            <p>Airworthiness Limited ("we", "us", "our") operates the website airworthiness.org.uk. We are the data controller responsible for your personal data under the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.</p>
            <p>Contact: <a href="mailto:contact@airworthiness.org.uk" className="text-primary hover:underline">contact@airworthiness.org.uk</a></p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">2. Data We Collect</h2>
            <p>We collect the following categories of personal data:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Identity data:</strong> first name, middle name(s), last name.</li>
              <li><strong>Contact data:</strong> email address.</li>
              <li><strong>Licence data:</strong> UK CAA Aircraft Maintenance Licence reference number, licence categories held, aircraft type endorsements and dates, photographs of your licence document.</li>
              <li><strong>Professional data:</strong> maintenance logbook entries (task descriptions, dates, aircraft details, verification records), module exam progress, continuation training certificates.</li>
              <li><strong>Technical data:</strong> IP address, browser type, device information, pages visited, collected automatically via cookies and similar technologies.</li>
              <li><strong>Account data:</strong> authentication credentials (encrypted), account preferences.</li>
              <li><strong>Public profile data (optional):</strong> if you choose to enable a public profile, we process the following data for the purpose of displaying it: a public handle of your choice, your display name, an optional public profile photo (separate from your licence photo), the type ratings and licence categories you hold, and any optional sections you choose to enable (employment status label, years in industry, apprenticeship completion, continuation training currency status). You may disable your public profile at any time, and the page will become inaccessible immediately.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">3. How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To create and manage your account.</li>
              <li>To provide licence tracking, digital logbook, and training management services.</li>
              <li>To verify licence holder status for trust privileges on the platform (consent-based).</li>
              <li>To enable licence-verified professionals to interact with other users.</li>
              <li>To display your public professional profile to other users and to the public, <strong>only if you have explicitly enabled this feature</strong>. The public profile is opt-in and disabled by default. You may opt out at any time.</li>
              <li>To analyse website usage and improve our services.</li>
              <li>To comply with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">4. Lawful Basis for Processing</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Consent:</strong> for licence verification, interactions with other users, marketing communications, and non-essential cookies.</li>
              <li><strong>Consent (specific to social features):</strong> processing of your data for the public profile, follower relationships, and feed (each enabled separately) is based on explicit, granular consent. You can withdraw consent for any social feature at any time, and your data will be removed from public view immediately. The core licence tracking, logbook, and training services do not require any social consent.</li>
              <li><strong>Contract:</strong> processing necessary to provide our services to you as a registered user.</li>
              <li><strong>Legitimate interests:</strong> website security, fraud prevention, service improvement, and analytics.</li>
              <li><strong>Legal obligation:</strong> where required by UK law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">5. How We Store Your Data</h2>
            <p>Your data is stored securely using Supabase, hosted in Ireland (eu-west-1), with encryption at rest and in transit. File uploads (licence photographs, certificates) are stored in Supabase Storage in the same region with row-level security policies. The website is served via Vercel.</p>
            <p>We retain your personal data for as long as your account is active. When you delete your account, your data is removed from our live systems immediately. Encrypted backups of the database are retained for 7 days as part of our disaster recovery process; your data may persist in these backups until they are rotated out, after which it is permanently deleted. Backups are stored within the EU and are not accessed except in the event of a database recovery.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">6. Third-Party Services</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Supabase:</strong> database hosting, authentication, and file storage.</li>
              <li><strong>Vercel:</strong> website hosting and content delivery.</li>
              <li><strong>Social login providers:</strong> Google, Apple, and Facebook (when used for authentication).</li>
            </ul>
            <p>We do not sell your personal data to third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">7. Your Rights Under UK GDPR</h2>
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
            <p>To exercise any of these rights, contact us at <a href="mailto:contact@airworthiness.org.uk" className="text-primary hover:underline">contact@airworthiness.org.uk</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">8. Social Features</h2>
            <p>Airworthiness offers optional social features that allow you to share your professional achievements with other engineers. These features are entirely opt-in and disabled by default. The core platform — licence tracking, digital logbook, training management — works fully without enabling any social feature.</p>
            <p><strong>What is shared when you enable a public profile:</strong> your name, optional profile photo, type ratings, licence categories, and any optional sections you choose to enable. Your profile becomes viewable at toolbox.airworthiness.org.uk/profile/[your-id], where [your-id] is a randomly assigned 8-digit number that uniquely identifies your profile.</p>
            <p><strong>What is never shared, even with a public profile:</strong> your licence number, date of birth, employer, customer or operator names, logbook entries, exam scores, contact details, and your private licence photograph.</p>
            <p><strong>You are in control:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>You choose whether to enable a public profile.</li>
              <li>You choose which optional sections to display.</li>
              <li>You can disable your public profile at any time, with immediate effect.</li>
              <li>You can delete your account at any time, which removes all data including any public profile.</li>
            </ul>
            <p><strong>Consent and withdrawal:</strong> Enabling a public profile is an explicit, separate consent action. You will be shown exactly what will be shared before you confirm. You can withdraw consent at any time from the Settings page. Withdrawal takes effect immediately on our live systems; backups will rotate out within 7 days.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">9. Cookies</h2>
            <p>We use cookies and similar technologies. For full details, see our <a href="/cookies" className="text-primary hover:underline">Cookie Policy</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">10. Complaints</h2>
            <p>If you believe we have not handled your data correctly, you have the right to lodge a complaint with the Information Commissioner's Office (ICO) at <a href="https://ico.org.uk" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">ico.org.uk</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">11. Changes to This Policy</h2>
            <p>We may update this policy from time to time. Changes will be posted on this page with an updated revision date.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
