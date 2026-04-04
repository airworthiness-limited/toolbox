import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Cookie Policy | Airworthiness' }

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Cookie Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: 28 March 2026</p>

        <div className="prose prose-gray prose-sm max-w-none space-y-6 text-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">1. What Are Cookies</h2>
            <p>Cookies are small text files placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences, keeping you signed in, and helping us understand how you use the site.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">2. Cookies We Use</h2>

            <h3 className="text-sm font-semibold text-foreground mt-4 mb-2">Strictly Necessary Cookies</h3>
            <p>These cookies are essential for the website to function. They cannot be switched off.</p>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-sm border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left p-2 border border-border font-semibold">Cookie</th>
                    <th className="text-left p-2 border border-border font-semibold">Purpose</th>
                    <th className="text-left p-2 border border-border font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border border-border font-mono text-xs">sb-*-auth-token</td>
                    <td className="p-2 border border-border">Authentication session (Supabase)</td>
                    <td className="p-2 border border-border">Session</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-border font-mono text-xs">cookie-consent</td>
                    <td className="p-2 border border-border">Records your cookie consent preference</td>
                    <td className="p-2 border border-border">1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-sm font-semibold text-foreground mt-6 mb-2">Analytics Cookies</h3>
            <p>These cookies help us understand how visitors interact with our website.</p>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-sm border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left p-2 border border-border font-semibold">Cookie</th>
                    <th className="text-left p-2 border border-border font-semibold">Purpose</th>
                    <th className="text-left p-2 border border-border font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border border-border font-mono text-xs">_ga, _gid</td>
                    <td className="p-2 border border-border">Google Analytics (pending setup)</td>
                    <td className="p-2 border border-border">Up to 2 years</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">3. Managing Cookies</h2>
            <p>When you first visit our website, a cookie banner will ask for your consent to non-essential cookies. You can change your preference at any time by clearing your browser cookies and revisiting the site.</p>
            <p>You can also control cookies through your browser settings. Note that disabling essential cookies may prevent the website from functioning correctly.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">4. Third-Party Cookies</h2>
            <p>Some cookies are placed by third-party services that appear on our pages. We do not control these cookies. For more information, refer to the privacy policies of:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><a href="https://policies.google.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google (Analytics)</a></li>
              <li><a href="https://supabase.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Supabase</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">5. Contact</h2>
            <p>For questions about our use of cookies, contact us at <a href="mailto:contact@airworthiness.org.uk" className="text-primary hover:underline">contact@airworthiness.org.uk</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
