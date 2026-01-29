import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

const pricingTiers = [
  {
    name: 'Explorer',
    price: 'Free',
    priceDetail: 'Forever',
    description: 'Perfect for trying us out',
    features: [
      'Browse our full catalog',
      'Basic student verification',
      '5-10% student discounts',
      'Standard shipping rates',
      'Email support',
      'Community access',
    ],
    cta: 'Start Free',
    ctaLink: '/auth/register',
    highlighted: false,
    gradient: 'from-card to-accent/20',
  },
  {
    name: 'Scholar',
    price: '$9',
    priceDetail: 'per month',
    description: 'For serious students',
    features: [
      'Everything in Explorer',
      'Priority verification (instant)',
      '15-25% student discounts',
      'Free shipping on all orders',
      'Priority email support',
      'Early access to new products',
      'Exclusive deals & bundles',
      'No purchase minimums',
    ],
    cta: 'Go Scholar',
    ctaLink: '/auth/register?plan=scholar',
    highlighted: true,
    gradient: 'from-primary/10 via-card to-secondary/30',
  },
  {
    name: 'Academy',
    price: '$24',
    priceDetail: 'per month',
    description: 'For student organizations',
    features: [
      'Everything in Scholar',
      'Up to 10 team members',
      '25-35% bulk discounts',
      'Dedicated account manager',
      'Phone & chat support',
      'Custom purchase orders',
      'Volume pricing options',
      'Quarterly business reviews',
      'Tech consulting calls',
    ],
    cta: 'Contact Sales',
    ctaLink: '/contact?plan=academy',
    highlighted: false,
    gradient: 'from-card to-primary/5',
  },
]

const faqs = [
  {
    question: 'Can I switch plans anytime?',
    answer: 'Absolutely. Upgrade, downgrade, or cancel anytime. No contracts, no hassle. Changes take effect immediately.',
  },
  {
    question: 'What counts as "student verification"?',
    answer: 'A valid .edu email address or enrollment documents. Explorer takes 24-48 hours. Scholar is instant. Simple as that.',
  },
  {
    question: 'Do prices include shipping?',
    answer: 'Explorer has standard shipping rates. Scholar and Academy include free shipping on all orders, no minimums.',
  },
  {
    question: 'Is there a refund policy?',
    answer: 'Yes. Cancel within 30 days for a full refund, no questions asked. Products have standard return policies.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'Credit cards, debit cards, PayPal, and student financial aid portals. We make it easy to pay your way.',
  },
]

export default function PricingPage() {
  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="grain-texture relative py-24 bg-gradient-to-br from-secondary/30 via-background to-accent/20">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              Pricing that makes
              <span className="block text-primary mt-2">sense</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              No hidden fees. No surprise charges. Just honest pricing
              for students who need tech that works.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-24">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Grid with asymmetric highlighting */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {pricingTiers.map((tier, index) => (
                <Card
                  key={tier.name}
                  className={`relative ${
                    tier.highlighted
                      ? 'lg:scale-105 shadow-xl border-2 border-primary/20'
                      : 'shadow-lg'
                  } bg-gradient-to-br ${tier.gradient}`}
                >
                  {tier.highlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center px-4 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground shadow-lg">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <CardHeader className="space-y-4 pb-8">
                    <div>
                      <CardTitle className="text-2xl mb-2">{tier.name}</CardTitle>
                      <CardDescription>{tier.description}</CardDescription>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-serif text-5xl font-bold text-foreground">
                          {tier.price}
                        </span>
                        {tier.priceDetail && (
                          <span className="text-muted-foreground">
                            {tier.priceDetail}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <svg
                            className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-sm text-foreground/90">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button
                      asChild
                      variant={tier.highlighted ? 'default' : 'outline'}
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

      {/* Value Props */}
      <section className="py-24 bg-secondary/30">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-4">
                Why students choose us
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                We're not trying to maximize profits. We're trying to help students get the tech they need.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-gradient-to-br from-card to-accent/20">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <CardTitle className="text-xl">No Lock-In</CardTitle>
                  <CardDescription>
                    Cancel anytime. Keep your discounts through the end of your billing period. No penalties.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-gradient-to-br from-card to-primary/5">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <CardTitle className="text-xl">Privacy First</CardTitle>
                  <CardDescription>
                    We verify you're a student, then forget about it. Your data stays yours. No tracking, no selling.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-gradient-to-br from-card to-secondary/50">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                  </div>
                  <CardTitle className="text-xl">Actually Useful</CardTitle>
                  <CardDescription>
                    Real discounts on gear you actually need. No inflated prices, no fake "deals". Just honest value.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-24">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-4">
                Questions?
              </h2>
              <p className="text-lg text-muted-foreground">
                We've got answers. Still confused? Just ask us.
              </p>
            </div>

            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <Card key={index} className="bg-gradient-to-br from-card to-secondary/20">
                  <CardHeader>
                    <CardTitle className="text-xl">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-4">
                Still have questions?
              </p>
              <Button asChild variant="outline" size="lg">
                <Link href="/contact">Talk to a Human</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary/5 via-background to-secondary/30 grain-texture">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="font-serif text-4xl sm:text-5xl font-bold">
              Ready to save?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of students who are getting better deals on tech.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/auth/register">Start Free</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/products">Browse Products</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
