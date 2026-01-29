import { Navbar } from '@/components/layout/navbar'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <>
      <Navbar />

      {/* Hero Section with Grain Texture */}
      <section className="grain-texture relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-dot-pattern">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/50 via-background to-accent/30" />

        <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="font-serif text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight">
              Tech that
              <span className="block text-primary mt-2">feels right</span>
            </h1>

            <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Curated technology for students who value quality over hype.
              Real gear, real discounts, real simple.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg" className="text-base">
                <Link href="/products">
                  Browse Collection
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base">
                <Link href="/auth/register">
                  Get Student Access
                </Link>
              </Button>
            </div>

            <div className="pt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="h-px w-16 bg-border" />
              <span>Verified students save 10-30%</span>
              <div className="h-px w-16 bg-border" />
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features - Asymmetric Layout */}
      <section className="py-24 bg-secondary/30">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-4">
                Built for students,
                <span className="block text-primary">by people who care</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                No flashy gimmicks. Just honest tech at honest prices.
              </p>
            </div>

            {/* Asymmetric Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Large Feature Card */}
              <Card className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-card to-secondary/50">
                <CardHeader className="space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <CardTitle className="text-3xl">Student Verified Pricing</CardTitle>
                  <CardDescription className="text-base">
                    Quick .edu email verification unlocks exclusive discounts.
                    No subscription fees, no hidden catches—just better prices for being a student.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="space-y-2">
                      <div className="text-4xl font-bold text-primary">10-30%</div>
                      <div className="text-sm text-muted-foreground">Average savings</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-4xl font-bold text-primary">2 min</div>
                      <div className="text-sm text-muted-foreground">To verify</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Small Cards */}
              <Card className="bg-gradient-to-br from-card to-accent/20">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <CardTitle className="text-xl">Curated Catalog</CardTitle>
                  <CardDescription>
                    Handpicked tech essentials. No overwhelm, just what works.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-gradient-to-br from-card to-primary/5">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <CardTitle className="text-xl">Fast Delivery</CardTitle>
                  <CardDescription>
                    Free shipping on orders over $50. Get your gear when you need it.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="md:col-span-2 bg-gradient-to-br from-primary/5 to-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">Real Support</CardTitle>
                      <CardDescription className="text-base">
                        Questions? Talk to actual humans who actually care.
                        Email us or hop on chat—we're here to help, not upsell.
                      </CardDescription>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary/5 via-background to-secondary/30 grain-texture">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="font-serif text-4xl sm:text-5xl font-bold">
              Ready to get started?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of students who've found their perfect tech setup.
            </p>
            <Button asChild size="lg" className="text-base">
              <Link href="/products">
                Browse Products
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
