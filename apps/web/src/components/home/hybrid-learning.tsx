'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Wifi, Users, Clock, BookOpen, Video } from 'lucide-react'

export function HybridLearning() {
  const [activeTab, setActiveTab] = useState<'onsite' | 'online'>('onsite')

  const features = {
    onsite: [
      {
        icon: Building2,
        title: 'Physical Labs & Studios',
        description: 'Access cutting-edge equipment and collaborative workspaces designed for hands-on learning.',
      },
      {
        icon: Users,
        title: 'In-Person Mentorship',
        description: 'Connect directly with instructors and peers. Get real-time feedback and build lasting relationships.',
      },
      {
        icon: BookOpen,
        title: 'Structured Curriculum',
        description: 'Follow a guided learning path with scheduled sessions, workshops, and group projects.',
      },
    ],
    online: [
      {
        icon: Wifi,
        title: 'Learn From Anywhere',
        description: 'Access courses, materials, and resources from your home, café, or anywhere with internet.',
      },
      {
        icon: Clock,
        title: 'Flexible Schedules',
        description: 'Learn at your own pace with open access to our knowledge base and lab environments anytime.',
      },
      {
        icon: Video,
        title: 'Cloud Resources',
        description: 'Virtual labs, online collaboration tools, and cloud-based development environments.',
      },
    ],
  }

  return (
    <section className="py-24 bg-white">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900 mb-4">
              Learn Your Way
            </h2>
            <p className="text-xl text-stone-600 max-w-2xl mx-auto">
              Choose the learning environment that fits your life. Or mix both—it's entirely up to you.
            </p>
          </div>

          {/* Toggle */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center bg-stone-100 rounded-2xl p-2 shadow-inner">
              <button
                onClick={() => setActiveTab('onsite')}
                className={`px-8 py-3 rounded-xl font-medium transition-all ${
                  activeTab === 'onsite'
                    ? 'bg-white text-orange-600 shadow-lg'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Building2 className="inline-block w-5 h-5 mr-2" />
                On-Site
              </button>
              <button
                onClick={() => setActiveTab('online')}
                className={`px-8 py-3 rounded-xl font-medium transition-all ${
                  activeTab === 'online'
                    ? 'bg-white text-orange-600 shadow-lg'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Wifi className="inline-block w-5 h-5 mr-2" />
                Online
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features[activeTab].map((feature, index) => (
              <Card
                key={index}
                className="border-2 border-stone-200 hover:border-orange-300 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-white to-stone-50"
              >
                <CardHeader>
                  <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
                    <feature.icon className="w-7 h-7 text-orange-600" />
                  </div>
                  <CardTitle className="text-xl text-stone-900">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-stone-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 text-center">
            <p className="text-stone-600 mb-4">
              Not sure which path is right for you?
            </p>
            <a
              href="/learning-paths"
              className="text-orange-600 font-medium hover:text-orange-700 underline underline-offset-4"
            >
              Explore our learning paths →
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
