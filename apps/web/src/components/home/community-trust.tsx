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
          {/* Stats Strip - hidden for now */}
          {/* Testimonials - hidden for now */}

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
                  size="lg"
                  className="bg-white/20 hover:bg-white/30 text-white font-semibold border-2 border-white"
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
