'use client'

import dynamic from 'next/dynamic'
import { CalendarDays } from 'lucide-react'

const HomeNetworkCanvas = dynamic(
  () =>
    import('@/components/home/HomeNetworkCanvas').then(
      (mod) => mod.HomeNetworkCanvas
    ),
  { ssr: false }
)

export function WorkshopHero() {
  return (
    <section className="relative py-20 lg:py-24 bg-gradient-to-b from-blue-50 to-white overflow-hidden">
      <div className="absolute inset-0">
        <HomeNetworkCanvas />
      </div>
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
          <CalendarDays className="w-4 h-4" />
          Youth Program
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
          Workshops
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Join our hands-on workshops to learn new skills and connect with our
          community. Real hardware, real projects, real learning.
        </p>
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg inline-block">
          <p className="text-sm text-green-800 font-semibold">
            🎉 Trial Run Now: FREE Workshops Through August 31, 2026
          </p>
          <p className="text-xs text-green-700 mt-1">
            Workshops held once every 2 weeks
          </p>
          <p className="text-xs text-green-700 mt-2 border-t border-green-200 pt-2">
            <strong>Note:</strong> Free trial does not include kits. Kits need to be purchased separately.
          </p>
        </div>
      </div>
    </section>
  )
}
