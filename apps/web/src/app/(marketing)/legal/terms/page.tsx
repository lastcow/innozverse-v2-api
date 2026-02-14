import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Innozverse',
  description: 'Terms and conditions for using Innozverse services.',
}

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto max-w-3xl px-4 py-16 sm:py-24">
        <p className="text-sm text-slate-500 mb-4">Last Updated: January 2026</p>

        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-8">
          Terms of Service
        </h1>

        <div className="prose prose-stone max-w-none space-y-8">
          <p className="text-lg text-slate-600 leading-relaxed">
            Welcome to Innozverse. By accessing or using our services, you agree to be bound by these Terms of Service. Please read them carefully before using our platform.
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">
              1. Acceptance of Terms
            </h2>
            <p className="text-slate-600">
              By creating an account or using Innozverse services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, you may not access or use our services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">
              2. Service Description
            </h2>
            <p className="text-slate-600">
              Innozverse provides cloud-based virtual machine access, including specialized environments such as Kali Linux and other security-focused tools, primarily for educational purposes. Our services are offered at discounted rates for verified students.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">
              3. Student Verification Requirements
            </h2>
            <div className="text-slate-600 space-y-3">
              <p>To access student pricing, you must:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Be currently enrolled at an accredited educational institution</li>
                <li>Provide valid verification through our approved verification process</li>
                <li>Maintain active student status throughout your subscription period</li>
                <li>Promptly notify us if your student status changes</li>
              </ul>
              <p className="pt-2">
                <strong>Misrepresentation of student status</strong> is a violation of these terms and will result in immediate account termination and potential legal action. You may be required to pay the difference between student and standard pricing for any period of unauthorized use.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900 text-red-900">
              4. Acceptable Use Policy
            </h2>
            <div className="text-slate-600 space-y-3 bg-red-50 border border-red-200 p-6 rounded-lg">
              <p className="font-semibold text-red-900">
                This section is critically important. Violation will result in immediate termination.
              </p>
              <p>You agree to use Innozverse services ONLY for lawful purposes. You expressly agree NOT to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Conduct unauthorized access</strong> to any computer system, network, or data</li>
                <li><strong>Perform illegal hacking activities</strong> including but not limited to: unauthorized penetration testing, exploiting vulnerabilities without permission, deploying malware, or conducting denial-of-service attacks</li>
                <li><strong>Attack any system</strong> without explicit written authorization from the system owner</li>
                <li><strong>Use security tools</strong> (including Kali Linux tools) against targets you do not own or have documented permission to test</li>
                <li><strong>Harvest credentials</strong> or personal information without authorization</li>
                <li><strong>Distribute malware, ransomware, or other malicious software</strong></li>
                <li><strong>Engage in any activity</strong> that violates local, state, national, or international laws</li>
              </ul>
              <p className="pt-2 font-semibold">
                Security tools provided through our platform are for EDUCATIONAL and AUTHORIZED TESTING purposes only. You are solely responsible for ensuring you have proper authorization before conducting any security testing.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">
              5. Permitted Uses
            </h2>
            <div className="text-slate-600 space-y-3">
              <p>Our services may be used for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Learning cybersecurity concepts in controlled environments</li>
                <li>Practicing on intentionally vulnerable systems you control (e.g., CTF platforms, personal labs)</li>
                <li>Authorized penetration testing with documented written permission</li>
                <li>Academic coursework and research</li>
                <li>Professional development and certification preparation</li>
                <li>Bug bounty programs where you have explicit authorization</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">
              6. Account Termination
            </h2>
            <div className="text-slate-600 space-y-3">
              <p>We reserve the right to suspend or terminate your account immediately, without prior notice, for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violation of the Acceptable Use Policy</li>
                <li>Fraudulent student verification or misrepresentation</li>
                <li>Non-payment or payment disputes</li>
                <li>Any activity that threatens the security or integrity of our services</li>
                <li>Any violation of applicable laws or regulations</li>
                <li>Any other breach of these Terms of Service</li>
              </ul>
              <p className="pt-2">
                Upon termination, your access to all services will be immediately revoked. We are not obligated to provide refunds for terminated accounts due to policy violations.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">
              7. Payment and Billing
            </h2>
            <div className="text-slate-600 space-y-3">
              <ul className="list-disc pl-6 space-y-2">
                <li>Subscription fees are billed in advance on a recurring basis</li>
                <li>All fees are non-refundable except as required by law</li>
                <li>We reserve the right to change pricing with 30 days notice</li>
                <li>Failed payments may result in service suspension</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">
              8. Intellectual Property
            </h2>
            <p className="text-slate-600">
              Innozverse and its content, features, and functionality are owned by Innozverse and are protected by international copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works without our express written permission.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">
              9. Disclaimer of Warranties
            </h2>
            <p className="text-slate-600">
              Our services are provided "as is" and "as available" without warranties of any kind, either express or implied. We do not guarantee that our services will be uninterrupted, secure, or error-free. You use our services at your own risk.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">
              10. Limitation of Liability
            </h2>
            <p className="text-slate-600">
              To the fullest extent permitted by law, Innozverse shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or other intangible losses, resulting from your use of our services. Our total liability shall not exceed the amount you paid us in the twelve months preceding the claim.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">
              11. Indemnification
            </h2>
            <p className="text-slate-600">
              You agree to indemnify and hold harmless Innozverse, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of our services, your violation of these terms, or your violation of any rights of another party.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">
              12. Governing Law
            </h2>
            <p className="text-slate-600">
              These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles. Any disputes arising from these terms shall be resolved through binding arbitration or in the courts of competent jurisdiction.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">
              13. Changes to Terms
            </h2>
            <p className="text-slate-600">
              We reserve the right to modify these Terms at any time. We will provide notice of significant changes by posting the updated terms on our website and updating the "Last Updated" date. Your continued use of our services after changes become effective constitutes acceptance of the revised terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">
              14. Contact Us
            </h2>
            <p className="text-slate-600">
              If you have questions about these Terms of Service, please contact us at:
            </p>
            <div className="text-slate-600 bg-slate-100 p-4 rounded-lg">
              <p><strong>Innozverse</strong></p>
              <p>Email: legal@innozverse.com</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
