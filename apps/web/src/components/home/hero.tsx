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
      <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-dot-pattern opacity-40" />

        {/* Content */}
        <div className="container relative z-10 px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full">
                <GraduationCap className="w-4 h-4 text-blue-700" />
                <span className="text-sm font-medium text-blue-700">
                  Learning Without Limits
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight">
                Your Campus,
                <span className="block text-blue-600 mt-2">Everywhere.</span>
              </h1>

              <p className="text-xl text-slate-600 leading-relaxed max-w-xl">
                Join a community of learners. Access state-of-the-art on-site facilities
                or learn from home at your own pace.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button asChild size="lg" className="text-base bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30">
                  <Link href="/auth/register">
                    <GraduationCap className="mr-2 h-5 w-5" />
                    Start Learning
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-base border-2 border-gray-300 hover:bg-slate-100"
                  onClick={() => setMapDialogOpen(true)}
                >
                  <MapPin className="mr-2 h-5 w-5" />
                  Visit On-Site
                </Button>
              </div>

{/* Stats - hidden for now */}
            </div>

            {/* Right: Visual */}
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-blue-100 to-slate-200 p-8 shadow-2xl">
                <div className="h-full w-full bg-white rounded-2xl shadow-inner flex items-center justify-center overflow-hidden">
                  {/* Placeholder for collaboration image */}
                  <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
                    <div className="text-center space-y-4 p-8">
                      <div className="w-20 h-20 mx-auto rounded-full bg-blue-600/10 flex items-center justify-center">
                        <GraduationCap className="w-10 h-10 text-blue-600" />
                      </div>
                      <p className="text-slate-700 font-medium">
                        Collaborative Learning Environment
                      </p>
                      <p className="text-sm text-slate-500">
                        Connect with peers, mentors, and industry experts
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500 rounded-2xl opacity-20 blur-2xl" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-green-500 rounded-2xl opacity-20 blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Map Dialog */}
      <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-slate-50 to-blue-50/20">
          <DialogHeader>
            <DialogTitle className="text-3xl text-slate-900">
              Come Visit Us.
            </DialogTitle>
            <DialogDescription className="text-slate-600 text-base">
              Experience our collaborative labs in person.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Address */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Our Location</h3>
                  <p className="text-slate-700 text-lg">
                    2 W Main St, Frostburg, MD, 21532
                  </p>
                </div>
              </div>
            </div>

            {/* Google Map Embed */}
            <div className="rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
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
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
              <div className="text-sm text-slate-700">
                <span className="font-semibold text-slate-900">Open Hours:</span>
                <span className="ml-1">Mon - Fri: 6 PM - 9 PM</span>
                <span className="mx-1">|</span>
                <span>Sat: 1 PM - 8 PM</span>
                <span className="mx-1">|</span>
                <span>Sun: Closed</span>
              </div>
              <p className="text-sm text-slate-700 mt-2">
                <span className="font-semibold text-slate-900">Contact:</span>{' '}
                <a href="mailto:contact@innozverse.com" className="text-blue-600 hover:text-blue-700 underline">
                  contact@innozverse.com
                </a>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
