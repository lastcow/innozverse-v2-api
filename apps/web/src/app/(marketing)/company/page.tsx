import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Cloud, ShieldCheck, BookOpen } from 'lucide-react'

export default function CompanyPage() {
  return (
    <>
      {/* Hero Section: The Vision */}
      <section className="relative py-32 bg-white">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[blue-600] leading-tight">
              Knowledge has no boundaries.
            </h1>
            <p className="text-xl sm:text-2xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
              We are building the infrastructure for the next generation of learners.
              Access enterprise-grade tools, hybrid labs, and mentorship—priced for
              students, not corporations.
            </p>
          </div>
        </div>
      </section>

      {/* Core Advantages Grid */}
      <section className="py-24 bg-slate-50">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card 1: Hybrid Infrastructure */}
            <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6 text-[blue-600]" />
                </div>
                <CardTitle className="text-2xl text-[blue-600]">
                  Hybrid Infrastructure.
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 leading-relaxed">
                  We bridge the gap between physical labs (Frostburg, MD) and the cloud.
                  Work on-site or spin up VMs instantly from your browser.
                </p>
              </CardContent>
            </Card>

            {/* Card 2: The Student Economy */}
            <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                  <Cloud className="w-6 h-6 text-[blue-600]" />
                </div>
                <CardTitle className="text-2xl text-[blue-600]">
                  The Student Economy.
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 leading-relaxed">
                  We reject the 'maximize profit' dogma. Our pricing is algorithmically
                  capped to remain affordable for students.
                </p>
              </CardContent>
            </Card>

            {/* Card 3: Security Native */}
            <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6 text-[blue-600]" />
                </div>
                <CardTitle className="text-2xl text-[blue-600]">
                  Security Native.
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 leading-relaxed">
                  Kali Linux is standard, not an upgrade. We provide isolated sandboxes
                  for ethical hacking and security research.
                </p>
              </CardContent>
            </Card>

            {/* Card 4: Open Knowledge */}
            <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-[blue-600]" />
                </div>
                <CardTitle className="text-2xl text-[blue-600]">
                  Open Knowledge.
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 leading-relaxed">
                  We don't gatekeep wisdom. Our platform is built to accelerate
                  'Time-to-Mastery' through community and mentorship.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Mission Statement Section */}
      <section className="py-24 bg-white">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            <div className="space-y-6">
              <h2 className="text-4xl sm:text-5xl font-bold text-[blue-600]">
                Our Mission
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Every student deserves access to professional-grade infrastructure.
                We're building a world where your location, background, or financial
                situation doesn't determine your ability to learn, experiment, and grow.
              </p>
            </div>

            <div className="space-y-6">
              <h2 className="text-4xl sm:text-5xl font-bold text-[blue-600]">
                Our Commitment
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                We commit to transparency in pricing, fairness in access, and excellence
                in education. Our platform grows with you—from your first "Hello World"
                to launching production systems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Location Section with Google Maps background */}
      <section className="relative py-16 overflow-hidden">
        {/* Google Maps embed as background */}
        <iframe
          className="absolute inset-0 w-full h-full"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3067.5!2d-78.9284!3d39.6581!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89ca5d5e5e5e5e5d%3A0x0!2s2+W+Main+St%2C+Frostburg%2C+MD+21532!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus"
          style={{ border: 0, filter: 'saturate(0.3) brightness(1.1)' }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="InnozVerse Location"
        />
        {/* Semi-transparent overlay for text readability */}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold text-white">
              Visit Us
            </h3>
            <p className="text-white font-medium">
              2 W Main St, Frostburg, MD 21532
            </p>
            <div className="text-sm text-white/90 font-medium space-y-1">
              <p>Mon - Fri: 6 PM - 9 PM</p>
              <p>Sat: 1 PM - 8 PM</p>
              <p>Sun: Closed</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
