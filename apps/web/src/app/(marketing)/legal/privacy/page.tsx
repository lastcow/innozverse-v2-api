import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Innozverse',
  description: 'Learn how Innozverse collects, uses, and protects your personal information.',
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#F4F3EE]">
      <div className="container mx-auto max-w-3xl px-4 py-16 sm:py-24">
        <p className="text-sm text-stone-500 mb-4">Last Updated: January 2026</p>

        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900 mb-8">
          Privacy Policy
        </h1>

        <div className="prose prose-stone max-w-none space-y-8">
          <p className="text-lg text-stone-600 leading-relaxed">
            At Innozverse, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services.
          </p>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              1. Information We Collect
            </h2>
            <div className="space-y-4 text-stone-600">
              <h3 className="font-semibold text-stone-800">Personal Information</h3>
              <p>When you create an account or use our services, we may collect:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Name and email address</li>
                <li>Educational institution and student status (for verification purposes)</li>
                <li>Payment information (processed securely through our payment providers)</li>
                <li>Account credentials</li>
              </ul>

              <h3 className="font-semibold text-stone-800 pt-4">Student Verification Data</h3>
              <p>
                To provide student-exclusive pricing, we collect verification information including your educational email address, institution name, and enrollment status. This information is used solely for verification purposes and is handled in accordance with applicable privacy laws.
              </p>

              <h3 className="font-semibold text-stone-800 pt-4">Usage and Technical Data</h3>
              <p>We automatically collect certain information when you use our services:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Virtual machine usage metrics (resource consumption, session duration)</li>
                <li>Device information and browser type</li>
                <li>IP address and general location data</li>
                <li>Log data and interaction patterns</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              2. How We Use Your Information
            </h2>
            <div className="text-stone-600 space-y-3">
              <p>We use the collected information to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Verify student eligibility for discounted pricing</li>
                <li>Process transactions and send related information</li>
                <li>Monitor and analyze usage patterns to optimize VM performance</li>
                <li>Send administrative information, updates, and security alerts</li>
                <li>Respond to your comments, questions, and support requests</li>
                <li>Detect, prevent, and address technical issues and security threats</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              3. Data Sharing and Disclosure
            </h2>
            <div className="text-stone-600 space-y-3">
              <p>We do not sell your personal information. We may share your information with:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Service Providers:</strong> Third-party vendors who assist in providing our services (payment processors, cloud infrastructure providers)</li>
                <li><strong>Student Verification Partners:</strong> Services that help verify educational enrollment status</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              4. Data Security
            </h2>
            <p className="text-stone-600">
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              5. Your Rights (GDPR/CCPA)
            </h2>
            <div className="text-stone-600 space-y-3">
              <p>Depending on your location, you may have the following rights:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
                <li><strong>Erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Receive your data in a portable format</li>
                <li><strong>Opt-out:</strong> Opt out of certain data processing activities</li>
                <li><strong>Non-discrimination:</strong> Exercise your rights without discriminatory treatment</li>
              </ul>
              <p className="pt-2">
                To exercise these rights, please contact us at privacy@innozverse.com.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              6. Data Retention
            </h2>
            <p className="text-stone-600">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law. When you delete your account, we will delete or anonymize your personal data within 30 days, except where retention is required for legal or legitimate business purposes.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              7. International Data Transfers
            </h2>
            <p className="text-stone-600">
              Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable laws.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              8. Changes to This Policy
            </h2>
            <p className="text-stone-600">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. Your continued use of our services after any changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              9. Contact Us
            </h2>
            <p className="text-stone-600">
              If you have questions about this Privacy Policy or our data practices, please contact us at:
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
