import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="container px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Column 1: Brand */}
            <div className="space-y-4">
              <Image
                src="/logo.png"
                alt="Innozverse"
                width={160}
                height={40}
                className="h-8 w-auto brightness-0 invert"
              />
              <p className="text-sm leading-relaxed">
                Empowering learners everywhere with accessible education and premium tools at student-exclusive prices.
              </p>
            </div>

            {/* Column 2: Explore */}
            <div className="space-y-4">
              <h4 className="font-semibold text-white text-sm uppercase tracking-wide">
                Explore
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/products" className="text-sm hover:text-blue-400 transition-colors">
                    Products
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-sm hover:text-blue-400 transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/pricing/pro" className="text-sm hover:text-blue-400 transition-colors">
                    Subscriptions
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Resources */}
            <div className="space-y-4">
              <h4 className="font-semibold text-white text-sm uppercase tracking-wide">
                Resources
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://docs.innozverse.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:text-blue-400 transition-colors"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="https://community.innozverse.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:text-blue-400 transition-colors"
                  >
                    Community
                  </a>
                </li>
                <li>
                  <Link href="/auth/register" className="text-sm hover:text-blue-400 transition-colors">
                    Student Verification
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Legal */}
            <div className="space-y-4">
              <h4 className="font-semibold text-white text-sm uppercase tracking-wide">
                Legal
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/legal/privacy" className="text-sm hover:text-blue-400 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/legal/terms" className="text-sm hover:text-blue-400 transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/legal/cookies" className="text-sm hover:text-blue-400 transition-colors">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-slate-400">
                © {currentYear} Innozverse. All rights reserved.
              </p>
              <div className="flex items-center gap-6">
                <a
                  href="https://discord.gg/QRKuTMHE5E"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-blue-400 transition-colors"
                  aria-label="Discord"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
