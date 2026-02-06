import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy | Innozverse',
  description: 'Learn how Innozverse uses cookies and similar technologies.',
}

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen bg-[#F4F3EE]">
      <div className="container mx-auto max-w-3xl px-4 py-16 sm:py-24">
        <p className="text-sm text-stone-500 mb-4">Last Updated: January 2026</p>

        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900 mb-8">
          Cookie Policy
        </h1>

        <div className="prose prose-stone max-w-none space-y-8">
          <p className="text-lg text-stone-600 leading-relaxed">
            This Cookie Policy explains how Innozverse uses cookies and similar tracking technologies when you visit our website and use our services. By using our services, you consent to the use of cookies as described in this policy.
          </p>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              1. What Are Cookies?
            </h2>
            <p className="text-stone-600">
              Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently, provide a better user experience, and give website owners useful information about how their site is being used.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              2. Types of Cookies We Use
            </h2>

            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 p-5 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Essential Cookies (Required)</h3>
                <p className="text-stone-600 mb-3">
                  These cookies are necessary for the website to function and cannot be disabled. They include:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-stone-600">
                  <li><strong>Authentication cookies:</strong> Keep you logged in and secure your session</li>
                  <li><strong>Security cookies:</strong> Protect against CSRF attacks and other security threats</li>
                  <li><strong>Load balancing cookies:</strong> Ensure optimal server performance</li>
                  <li><strong>User preference cookies:</strong> Remember your language and display settings</li>
                </ul>
                <p className="text-sm text-green-800 mt-3">
                  Retention: Session or up to 30 days
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-5 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Analytics Cookies (Optional)</h3>
                <p className="text-stone-600 mb-3">
                  These cookies help us understand how visitors interact with our website:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-stone-600">
                  <li><strong>Page view tracking:</strong> Which pages are visited and how often</li>
                  <li><strong>Feature usage:</strong> Which features are most popular</li>
                  <li><strong>Performance metrics:</strong> Page load times and error rates</li>
                  <li><strong>Traffic sources:</strong> How visitors find our website</li>
                </ul>
                <p className="text-sm text-blue-800 mt-3">
                  Provider: Self-hosted analytics | Retention: Up to 12 months
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 p-5 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-2">Preference Cookies (Optional)</h3>
                <p className="text-stone-600 mb-3">
                  These cookies remember your preferences to enhance your experience:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-stone-600">
                  <li><strong>Theme preferences:</strong> Light/dark mode settings</li>
                  <li><strong>Dashboard layout:</strong> Your customized dashboard configuration</li>
                  <li><strong>VM preferences:</strong> Default virtual machine settings</li>
                  <li><strong>Notification settings:</strong> Your communication preferences</li>
                </ul>
                <p className="text-sm text-purple-800 mt-3">
                  Retention: Up to 12 months
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              3. Cookie Details
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-stone-600 border border-stone-200 rounded-lg overflow-hidden">
                <thead className="bg-stone-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-stone-900">Cookie Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-900">Purpose</th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-900">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs">innoz_session</td>
                    <td className="px-4 py-3">Authentication session</td>
                    <td className="px-4 py-3">Session</td>
                  </tr>
                  <tr className="bg-stone-50">
                    <td className="px-4 py-3 font-mono text-xs">innoz_csrf</td>
                    <td className="px-4 py-3">Security token</td>
                    <td className="px-4 py-3">Session</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs">innoz_prefs</td>
                    <td className="px-4 py-3">User preferences</td>
                    <td className="px-4 py-3">12 months</td>
                  </tr>
                  <tr className="bg-stone-50">
                    <td className="px-4 py-3 font-mono text-xs">innoz_analytics</td>
                    <td className="px-4 py-3">Analytics identifier</td>
                    <td className="px-4 py-3">12 months</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs">innoz_consent</td>
                    <td className="px-4 py-3">Cookie consent status</td>
                    <td className="px-4 py-3">12 months</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              4. Third-Party Cookies
            </h2>
            <div className="text-stone-600 space-y-3">
              <p>We may use limited third-party services that set their own cookies:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Payment processors:</strong> Stripe or similar services for secure payment handling</li>
                <li><strong>Student verification:</strong> Verification service providers</li>
              </ul>
              <p>
                We do not use third-party advertising cookies or sell your data to advertisers.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              5. Managing Cookies
            </h2>
            <div className="text-stone-600 space-y-3">
              <p>You have control over cookies in several ways:</p>

              <h3 className="font-semibold text-stone-800 pt-2">Browser Settings</h3>
              <p>
                Most browsers allow you to refuse cookies or delete existing cookies. However, blocking essential cookies may prevent you from using our services properly.
              </p>

              <h3 className="font-semibold text-stone-800 pt-2">Our Cookie Settings</h3>
              <p>
                You can manage your cookie preferences through our cookie consent banner or in your account settings under "Privacy Preferences."
              </p>

              <h3 className="font-semibold text-stone-800 pt-2">Opt-Out Links</h3>
              <p>
                For analytics cookies, you can opt out through your account privacy settings at any time.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              6. Similar Technologies
            </h2>
            <div className="text-stone-600 space-y-3">
              <p>In addition to cookies, we may use similar technologies:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Local Storage:</strong> To store preferences and cached data in your browser</li>
                <li><strong>Session Storage:</strong> To temporarily store data during your browsing session</li>
              </ul>
              <p>These technologies are subject to the same policies and controls as cookies.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              7. Updates to This Policy
            </h2>
            <p className="text-stone-600">
              We may update this Cookie Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of any material changes by posting the updated policy on our website with a new "Last Updated" date.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              8. Contact Us
            </h2>
            <p className="text-stone-600">
              If you have questions about our use of cookies, please contact us at:
            </p>
            <div className="text-stone-600 bg-stone-100 p-4 rounded-lg">
              <p><strong>Innozverse</strong></p>
              <p>Email: privacy@innozverse.com</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
