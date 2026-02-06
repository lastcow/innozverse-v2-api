import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Cloud, ShieldCheck, BookOpen } from 'lucide-react'

export default function CompanyPage() {
  return (
    <>
      {/* Hero Section: The Vision */}
      <section className="relative py-32 bg-[#F4F3EE]">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-[#1C1917] leading-tight">
              Knowledge has no boundaries.
            </h1>
            <p className="text-xl sm:text-2xl text-stone-600 leading-relaxed max-w-3xl mx-auto">
              We are building the infrastructure for the next generation of learners.
              Access enterprise-grade tools, hybrid labs, and mentorship—priced for
              students, not corporations.
            </p>
          </div>
        </div>
      </section>

      {/* Core Advantages Grid */}
      <section className="py-24 bg-stone-50">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card 1: Hybrid Infrastructure */}
            <Card className="bg-white border-stone-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6 text-[#1C1917]" />
                </div>
                <CardTitle className="font-serif text-2xl text-[#1C1917]">
                  Hybrid Infrastructure.
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-stone-600 leading-relaxed">
                  We bridge the gap between physical labs (Frostburg, MD) and the cloud.
                  Work on-site or spin up VMs instantly from your browser.
                </p>
              </CardContent>
            </Card>

            {/* Card 2: The Student Economy */}
            <Card className="bg-white border-stone-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center mb-4">
                  <Cloud className="w-6 h-6 text-[#1C1917]" />
                </div>
                <CardTitle className="font-serif text-2xl text-[#1C1917]">
                  The Student Economy.
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-stone-600 leading-relaxed">
                  We reject the 'maximize profit' dogma. Our pricing is algorithmically
                  capped to remain affordable for students.
                </p>
              </CardContent>
            </Card>

            {/* Card 3: Security Native */}
            <Card className="bg-white border-stone-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6 text-[#1C1917]" />
                </div>
                <CardTitle className="font-serif text-2xl text-[#1C1917]">
                  Security Native.
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-stone-600 leading-relaxed">
                  Kali Linux is standard, not an upgrade. We provide isolated sandboxes
                  for ethical hacking and security research.
                </p>
              </CardContent>
            </Card>

            {/* Card 4: Open Knowledge */}
            <Card className="bg-white border-stone-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-[#1C1917]" />
                </div>
                <CardTitle className="font-serif text-2xl text-[#1C1917]">
                  Open Knowledge.
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-stone-600 leading-relaxed">
                  We don't gatekeep wisdom. Our platform is built to accelerate
                  'Time-to-Mastery' through community and mentorship.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Mission Statement Section */}
      <section className="py-24 bg-[#F4F3EE]">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            <div className="space-y-6">
              <h2 className="font-serif text-4xl sm:text-5xl font-bold text-[#1C1917]">
                Our Mission
              </h2>
              <p className="text-lg text-stone-600 leading-relaxed">
                Every student deserves access to professional-grade infrastructure.
                We're building a world where your location, background, or financial
                situation doesn't determine your ability to learn, experiment, and grow.
              </p>
            </div>

            <div className="space-y-6">
              <h2 className="font-serif text-4xl sm:text-5xl font-bold text-[#1C1917]">
                Our Commitment
              </h2>
              <p className="text-lg text-stone-600 leading-relaxed">
                We commit to transparency in pricing, fairness in access, and excellence
                in education. Our platform grows with you—from your first "Hello World"
                to launching production systems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-16 bg-white border-t border-stone-200">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <h3 className="font-serif text-2xl font-bold text-[#1C1917]">
              Visit Us
            </h3>
            <p className="text-stone-600">
              2 W Main St, Frostburg, MD 21532
            </p>
            <p className="text-sm text-stone-500">
              Open Monday - Friday, 9 AM - 5 PM
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
