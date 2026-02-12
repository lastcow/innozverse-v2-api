'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Terminal, Zap, ShieldCheck, Crown } from 'lucide-react'
import Link from 'next/link'

interface PricingTier {
  name: string
  basePrice: number | null // null for Free only
  displayPrice: string
  regularPrice?: string // For strikethrough when student discount is active
  description: string
  features: string[]
  cta: string
  ctaLink: string
  highlighted: boolean
  variant: 'outline' | 'default'
  badge?: string
  icon: typeof Terminal | typeof Zap | typeof ShieldCheck | typeof Crown
  showStudentPrice?: boolean
}

const faqs = [
  {
    question: 'Can I switch plans anytime?',
    answer: 'Absolutely. Upgrade, downgrade, or cancel anytime. No contracts, no hassle. Changes take effect immediately.',
  },
  {
    question: 'What makes Basic different from Free?',
    answer: 'Basic includes a dedicated Kali Linux VM for cybersecurity learning, plus community support. It\'s the perfect entry point for security students who need hands-on practice.',
  },
  {
    question: 'What is a Standard Linux VM vs Kali Linux VM?',
    answer: 'Standard VMs are general-purpose Linux environments. Kali VMs are specialized security testing environments with pre-installed tools.',
  },
  {
    question: 'How do the discounts stack?',
    answer: 'The annual billing discount (10%) is applied first, then the student discount (15%) is applied on top of that. Together, you can save up to 23.5% off the regular monthly price!',
  },
  {
    question: 'How do I qualify for the student discount?',
    answer: 'Verify your student status with a valid .edu email address or enrollment documents. Once verified, the student discount applies to all eligible plans.',
  },
  {
    question: 'Is there a refund policy?',
    answer: 'Yes. Cancel within 30 days for a full refund, no questions asked. No questions, no hassle.',
  },
]

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false)
  const [isStudent, setIsStudent] = useState(false)

  const getPricingTiers = (annual: boolean, student: boolean): PricingTier[] => {
    // Apply discounts sequentially
    let annualDiscount = annual ? 0.9 : 1 // 10% off when annual
    let studentDiscount = student ? 0.85 : 1 // Additional 15% off for students
    const totalDiscount = annualDiscount * studentDiscount

    // Multiplier: 12 for annual (yearly total), 1 for monthly
    const periodMultiplier = annual ? 12 : 1

    return [
      {
        name: 'Free',
        basePrice: null,
        displayPrice: '$0',
        description: 'Perfect for getting started.',
        features: [
          '1 Standard Linux VM',
          'Basic community access',
          'Public documentation',
        ],
        cta: 'View Details',
        ctaLink: '/pricing/free',
        highlighted: false,
        variant: 'outline' as const,
        icon: Terminal,
      },
      {
        name: 'Basic',
        basePrice: 19.99,
        displayPrice: `$${(19.99 * periodMultiplier * totalDiscount).toFixed(2)}`,
        regularPrice: student ? `$${(19.99 * periodMultiplier * annualDiscount).toFixed(2)}` : undefined,
        description: 'Perfect entry point for cybersecurity students.',
        features: [
          '1 Standard Linux VM',
          '1 Kali Linux VM',
          'Community Support',
        ],
        cta: 'View Details',
        ctaLink: '/pricing/basic',
        highlighted: false,
        variant: 'default' as const,
        icon: Zap,
        showStudentPrice: student,
      },
      {
        name: 'Pro',
        basePrice: 29.99,
        displayPrice: `$${(29.99 * periodMultiplier * totalDiscount).toFixed(2)}`,
        regularPrice: student ? `$${(29.99 * periodMultiplier * annualDiscount).toFixed(2)}` : undefined,
        description: 'For serious developers and learners.',
        features: [
          '2 Standard Linux VMs',
          '1 Kali Linux VM (Security Lab)',
          'Community Support',
        ],
        cta: 'View Details',
        ctaLink: '/pricing/pro',
        highlighted: true,
        variant: 'default' as const,
        badge: 'Most Popular',
        icon: ShieldCheck,
        showStudentPrice: student,
      },
      {
        name: 'Premium',
        basePrice: 59.99,
        displayPrice: `$${(59.99 * periodMultiplier * totalDiscount).toFixed(2)}`,
        regularPrice: student ? `$${(59.99 * periodMultiplier * annualDiscount).toFixed(2)}` : undefined,
        description: 'The ultimate toolkit for professionals.',
        features: [
          '3 Standard Linux VMs',
          '2 Kali Linux VMs',
          'Priority Support',
        ],
        cta: 'View Details',
        ctaLink: '/pricing/premium',
        highlighted: false,
        variant: 'default' as const,
        icon: Crown,
        showStudentPrice: student,
      },
    ]
  }

  const pricingTiers = getPricingTiers(isAnnual, isStudent)

  return (
    <>
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-stone-50 via-orange-50/30 to-stone-100">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-stone-900">
              Simple Pricing.
              <span className="block text-orange-600 mt-2">Learn at Your Pace.</span>
            </h1>
            <p className="text-xl text-stone-600 leading-relaxed">
              Start for free, pay only for what you use, or unlock full access with a plan that fits you.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-24 bg-white">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Billing Toggle */}
            <div className="flex flex-col items-center gap-6 mb-12">
              <div className="inline-flex items-center bg-stone-100 rounded-2xl p-2 shadow-inner">
                <button
                  onClick={() => setIsAnnual(false)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${
                    !isAnnual
                      ? 'bg-white text-orange-600 shadow-lg'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setIsAnnual(true)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${
                    isAnnual
                      ? 'bg-white text-orange-600 shadow-lg'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Annual
                  <span className="ml-2 text-xs text-green-600 font-semibold">
                    (Save 10%)
                  </span>
                </button>
              </div>

              {/* Student Discount Toggle */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsStudent(!isStudent)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isStudent ? 'bg-orange-600' : 'bg-stone-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isStudent ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <label className="text-sm font-medium text-stone-900 cursor-pointer" onClick={() => setIsStudent(!isStudent)}>
                  Apply Student Discount{' '}
                  <span className="text-orange-600 font-bold">(Extra 15% OFF)</span>
                </label>
              </div>
            </div>

            {/* 4-column responsive grid with equal height cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {pricingTiers.map((tier) => (
                <Card
                  key={tier.name}
                  className={`relative rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col ${
                    tier.highlighted
                      ? 'bg-stone-100 border-2 border-orange-300'
                      : 'bg-white border-2 border-stone-200'
                  }`}
                >
                  {tier.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-orange-600 text-white shadow-lg px-4 py-1">
                        {tier.badge}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="space-y-4 pb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                        <tier.icon className="w-5 h-5 text-orange-600" />
                      </div>
                      <CardTitle className="font-serif text-2xl text-stone-900">
                        {tier.name}
                      </CardTitle>
                    </div>
                    <CardDescription className="text-stone-600 text-sm leading-relaxed">
                      {tier.description}
                    </CardDescription>

                    <div className="space-y-1">
                      {tier.showStudentPrice && tier.regularPrice && (
                        <div className="flex items-center gap-2">
                          <span className="text-stone-400 line-through text-lg">
                            {tier.regularPrice}
                          </span>
                          <Badge className="bg-orange-600 text-white text-xs px-2 py-0.5">
                            Student
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-baseline gap-1">
                        <span className="font-serif text-4xl font-bold text-stone-900">
                          {tier.displayPrice}
                        </span>
                        {tier.basePrice !== null && (
                          <span className="text-stone-500 text-sm">
                            / {isAnnual ? 'year' : 'month'}
                          </span>
                        )}
                      </div>
                      {tier.basePrice !== null && isAnnual && (
                        <p className="text-xs text-stone-500">
                          (Equivalent to ${(parseFloat(tier.displayPrice.replace('$', '')) / 12).toFixed(2)}/mo)
                        </p>
                      )}
                      {tier.basePrice !== null && isAnnual && !isStudent && (
                        <p className="text-xs text-green-600 font-medium">
                          Save ${((tier.basePrice * 0.1) * 12).toFixed(2)} vs monthly billing
                        </p>
                      )}
                      {tier.basePrice !== null && isStudent && !isAnnual && (
                        <p className="text-xs text-orange-600 font-medium">
                          Student discount: ${((tier.basePrice * 0.15) * 12).toFixed(2)}/year savings
                        </p>
                      )}
                      {tier.basePrice !== null && isStudent && isAnnual && (
                        <p className="text-xs text-orange-600 font-medium">
                          Total savings: ${(((1 - (0.9 * 0.85)) * tier.basePrice) * 12).toFixed(2)}/year
                        </p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pb-6 flex-grow">
                    <ul className="space-y-3">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-stone-700 leading-relaxed">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="mt-auto">
                    <Button
                      asChild
                      variant={tier.variant}
                      size="lg"
                      className="w-full"
                    >
                      <Link href={tier.ctaLink}>{tier.cta}</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Need More Power Section */}
      <section className="py-16 bg-stone-50 border-y-2 border-stone-200">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="font-serif text-4xl font-bold text-stone-900">
              Need More Power?
            </h2>
            <p className="text-lg text-stone-600">
              Looking for custom configurations, dedicated resources, or enterprise-grade solutions? We can tailor a plan to fit your needs.
            </p>
            <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700 text-white">
              <Link href="/contact">Contact innoZverse</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-24 bg-gradient-to-br from-orange-50 via-stone-50 to-green-50/30">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900 mb-6">
                Why students choose us
              </h2>
              <div className="max-w-3xl mx-auto">
                <blockquote className="bg-white rounded-xl border-l-4 border-orange-500 shadow-lg px-8 py-6">
                  <p className="text-lg text-stone-700 leading-relaxed">
                    <span className="text-stone-900 font-semibold">Architected for Access.</span> We optimize for{' '}
                    <span className="text-stone-900 font-semibold">impact, not just margins</span>. Our platform delivers{' '}
                    <span className="text-stone-900 font-semibold">enterprise-grade compute</span> and tooling at a student-friendly scale, ensuring cost is never a bottleneck to innovation.
                  </p>
                </blockquote>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-white border-2 border-stone-200 rounded-2xl shadow-lg hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <CardTitle className="font-serif text-xl text-stone-900">No Lock-In</CardTitle>
                  <CardDescription className="text-stone-600">
                    Cancel anytime. Keep your access through the end of your billing period. No penalties.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-white border-2 border-stone-200 rounded-2xl shadow-lg hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <CardTitle className="font-serif text-xl text-stone-900">Privacy First</CardTitle>
                  <CardDescription className="text-stone-600">
                    We verify you're a student, then forget about it. Your data stays yours. No tracking, no selling.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-white border-2 border-stone-200 rounded-2xl shadow-lg hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                    <Terminal className="w-6 h-6 text-orange-600" />
                  </div>
                  <CardTitle className="font-serif text-xl text-stone-900">Production-Ready VMs</CardTitle>
                  <CardDescription className="text-stone-600">
                    Instant access to Linux environments. From standard dev boxes to specialized security labs.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-24 bg-white">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900 mb-4">
                Questions?
              </h2>
              <p className="text-lg text-stone-600">
                We've got answers. Still confused? Just ask us.
              </p>
            </div>

            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <Card key={index} className="bg-gradient-to-br from-white to-stone-50 border-2 border-stone-200 rounded-2xl shadow-lg">
                  <CardHeader>
                    <CardTitle className="font-serif text-xl text-stone-900">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-stone-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-stone-600 mb-4">
                Still have questions?
              </p>
              <Button asChild variant="outline" size="lg" className="border-2 border-stone-300 hover:bg-stone-100">
                <Link href="/contact">Talk to a Human</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Usage Policy Notice */}
      <section className="py-12 bg-amber-50 border-y border-amber-200">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white border-2 border-amber-300 rounded-2xl p-6 shadow-md">
              <div className="flex items-center justify-center gap-2 mb-3">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="font-bold text-amber-800 text-center">Acceptable Use Policy</h3>
              </div>
              <p className="text-sm text-amber-700 leading-relaxed text-center mb-4">
                All virtual machines provided by Innozverse are intended strictly for educational and learning purposes. The following activities are prohibited:
              </p>
              <ul className="text-sm text-amber-800 space-y-1.5 max-w-xl mx-auto">
                <li className="flex items-start gap-2"><span className="text-red-500 font-bold mt-0.5">&#x2715;</span> Production workloads or commercial use</li>
                <li className="flex items-start gap-2"><span className="text-red-500 font-bold mt-0.5">&#x2715;</span> Cryptocurrency mining or blockchain validation</li>
                <li className="flex items-start gap-2"><span className="text-red-500 font-bold mt-0.5">&#x2715;</span> Unauthorized scanning or attacks on external systems</li>
                <li className="flex items-start gap-2"><span className="text-red-500 font-bold mt-0.5">&#x2715;</span> Hosting public-facing services or websites</li>
                <li className="flex items-start gap-2"><span className="text-red-500 font-bold mt-0.5">&#x2715;</span> Distributing malware or illegal content</li>
                <li className="flex items-start gap-2"><span className="text-red-500 font-bold mt-0.5">&#x2715;</span> Reselling or sharing VM access with others</li>
              </ul>
              <p className="text-xs text-amber-600 text-center mt-4 font-medium">
                Violation of these policies may result in immediate account suspension. All security testing must be performed within your own lab environment only.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-orange-50 via-stone-50 to-green-50/30">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900">
              Ready to start learning?
            </h2>
            <p className="text-xl text-stone-600">
              Join thousands of students who are building their future with Innozverse.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700 text-white">
                <Link href="/auth/register">Start Free</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-2 border-stone-300 hover:bg-stone-100">
                <Link href="/products">Browse Marketplace</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
