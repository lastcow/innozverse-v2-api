'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import Link from 'next/link'
import { GraduationCap, MapPin } from 'lucide-react'

export function Hero() {
  const [mapDialogOpen, setMapDialogOpen] = useState(false)

  return (
    <>
      <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-gradient-to-br from-stone-50 via-orange-50/30 to-stone-100">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-dot-pattern opacity-40" />

        {/* Content */}
        <div className="container relative z-10 px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-full">
                <GraduationCap className="w-4 h-4 text-orange-700" />
                <span className="text-sm font-medium text-orange-700">
                  Learning Without Limits
                </span>
              </div>

              <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-stone-900 leading-tight">
                Your Campus,
                <span className="block text-orange-600 mt-2">Everywhere.</span>
              </h1>

              <p className="text-xl text-stone-600 leading-relaxed max-w-xl">
                Join a community of learners. Access state-of-the-art on-site facilities
                or learn from home at your own pace.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button asChild size="lg" className="text-base bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20 hover:shadow-xl hover:shadow-orange-600/30">
                  <Link href="/auth/register">
                    <GraduationCap className="mr-2 h-5 w-5" />
                    Start Learning
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-base border-2 border-stone-300 hover:bg-stone-100"
                  onClick={() => setMapDialogOpen(true)}
                >
                  <MapPin className="mr-2 h-5 w-5" />
                  Visit On-Site
                </Button>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-8 pt-8 border-t border-stone-200">
                <div>
                  <div className="text-3xl font-bold text-stone-900">10,000+</div>
                  <div className="text-sm text-stone-600">Students Verified</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-stone-900">50+</div>
                  <div className="text-sm text-stone-600">Courses Available</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-600">40%</div>
                  <div className="text-sm text-stone-600">Average Savings</div>
                </div>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-orange-100 to-stone-200 p-8 shadow-2xl">
                <div className="h-full w-full bg-white rounded-2xl shadow-inner flex items-center justify-center overflow-hidden">
                  {/* Placeholder for collaboration image */}
                  <div className="relative w-full h-full bg-gradient-to-br from-orange-50 to-stone-100 flex items-center justify-center">
                    <div className="text-center space-y-4 p-8">
                      <div className="w-20 h-20 mx-auto rounded-full bg-orange-600/10 flex items-center justify-center">
                        <GraduationCap className="w-10 h-10 text-orange-600" />
                      </div>
                      <p className="text-stone-700 font-medium">
                        Collaborative Learning Environment
                      </p>
                      <p className="text-sm text-stone-500">
                        Connect with peers, mentors, and industry experts
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-orange-500 rounded-2xl opacity-20 blur-2xl" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-green-500 rounded-2xl opacity-20 blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Map Dialog */}
      <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-stone-50 to-orange-50/20">
          <DialogHeader>
            <DialogTitle className="font-serif text-3xl text-stone-900">
              Come Visit Us.
            </DialogTitle>
            <DialogDescription className="text-stone-600 text-base">
              Experience our collaborative labs in person.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Address */}
            <div className="bg-white rounded-xl border-2 border-stone-200 p-6">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-orange-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-stone-900 mb-1">Our Location</h3>
                  <p className="text-stone-700 text-lg">
                    2 W Main St, Frostburg, MD, 21532
                  </p>
                </div>
              </div>
            </div>

            {/* Google Map Embed */}
            <div className="rounded-xl overflow-hidden border-2 border-stone-200 shadow-lg">
              <iframe
                src="https://www.google.com/maps?q=2+W+Main+St,+Frostburg,+MD,+21532&output=embed"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Innozverse Location"
                className="w-full h-[400px]"
              />
            </div>

            {/* Additional Info */}
            <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
              <p className="text-sm text-stone-700">
                <span className="font-semibold text-stone-900">Open Hours:</span> Monday - Friday, 9 AM - 5 PM
              </p>
              <p className="text-sm text-stone-700 mt-2">
                <span className="font-semibold text-stone-900">Contact:</span>{' '}
                <a href="mailto:hello@innozverse.com" className="text-orange-600 hover:text-orange-700 underline">
                  hello@innozverse.com
                </a>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
