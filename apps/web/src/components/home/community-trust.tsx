'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Users, Shield, ExternalLink } from 'lucide-react'
import Link from 'next/link'

const testimonials = [
  {
    quote: "Innozverse gave me access to the tools I needed without the financial stress. The community is incredible.",
    author: "Sarah Chen",
    role: "Computer Science, Junior",
    avatar: "SC",
  },
  {
    quote: "Being able to learn online and visit the campus when I need help made all the difference in my education.",
    author: "Marcus Johnson",
    role: "Engineering, Senior",
    avatar: "MJ",
  },
  {
    quote: "The student pricing is real. I saved over $800 on my laptop and software. Game changer.",
    author: "Elena Rodriguez",
    role: "Design, Sophomore",
    avatar: "ER",
  },
]

const stats = [
  { label: 'Students Verified', value: '10,000+', icon: Users },
  { label: 'Partner Institutions', value: '150+', icon: BookOpen },
  { label: 'Trust Score', value: '4.9/5', icon: Shield },
]

export function CommunityTrust() {
  return (
    <section className="py-24 bg-white">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Stats Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center p-8 rounded-2xl bg-gradient-to-br from-stone-50 to-orange-50/30 border-2 border-stone-100"
              >
                <stat.icon className="w-10 h-10 text-orange-600 mx-auto mb-4" />
                <div className="text-4xl font-bold text-stone-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-stone-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="mb-24">
            <div className="text-center mb-12">
              <h2 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900 mb-4">
                Trusted by Students
              </h2>
              <p className="text-xl text-stone-600 max-w-2xl mx-auto">
                Real stories from students who are building their future with Innozverse.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card
                  key={index}
                  className="border-2 border-stone-200 bg-gradient-to-br from-white to-stone-50"
                >
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-stone-900">
                          {testimonial.author}
                        </div>
                        <div className="text-sm text-stone-600">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-stone-700 leading-relaxed italic">
                      "{testimonial.quote}"
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Knowledge Base CTA */}
          <Card className="bg-gradient-to-br from-orange-600 to-orange-500 border-0 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />

            <CardHeader className="relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-3xl font-serif mb-3">
                    Explore Our Knowledge Base
                  </CardTitle>
                  <CardDescription className="text-orange-100 text-lg">
                    Get answers to common questions, learn about our programs,
                    and discover resources to help you succeed.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="relative z-10">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-orange-600 hover:bg-orange-50"
                >
                  <a
                    href="https://docs.innozverse.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit Knowledge Base
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-2 border-white/30 hover:bg-white/10 text-white"
                >
                  <Link href="/contact">
                    Contact Support
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
