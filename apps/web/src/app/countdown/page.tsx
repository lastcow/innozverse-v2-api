'use client'

import { useState, useEffect } from 'react'

const TARGET = new Date('2026-02-28T00:00:00')

function getTimeLeft() {
  const now = new Date().getTime()
  const diff = TARGET.getTime() - now

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

export default function CountdownPage() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000)
    return () => clearInterval(id)
  }, [])

  const units = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ]

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-white">
      <h1 className="mb-2 text-4xl font-bold tracking-tight sm:text-5xl">
        Innozverse
      </h1>
      <p className="mb-12 text-lg text-slate-400">Something amazing is coming</p>

      <div className="flex gap-4 sm:gap-6">
        {units.map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center">
            <span className="text-5xl font-bold tabular-nums text-blue-500 sm:text-7xl">
              {mounted ? String(value).padStart(2, '0') : '--'}
            </span>
            <span className="mt-2 text-xs uppercase tracking-widest text-slate-500 sm:text-sm">
              {label}
            </span>
          </div>
        ))}
      </div>

      <a
        href="mailto:contact@innozverse.com"
        className="mt-16 text-sm text-slate-500 transition-colors hover:text-blue-400"
      >
        contact@innozverse.com
      </a>
    </div>
  )
}
