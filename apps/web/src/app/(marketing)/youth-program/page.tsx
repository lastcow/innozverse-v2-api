import { Button } from '@/components/ui/button'
import {
  Zap,
  Cpu,
  Cog,
  Bot,
  Star,
  Rocket,
  Heart,
  Trophy,
  ChevronRight,
  GraduationCap,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const workshops = [
  {
    name: 'Energy & Drive',
    emoji: '⚡',
    tagline: 'Power up and drive!',
    description:
      'Learn how electricity makes things move! Build your own solar-powered car and explore the science behind wind turbines and light bulbs.',
    grades: 'Ages 7+',
    icon: Zap,
    color: 'from-orange-400 to-yellow-300',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-700',
    img: '/youth/workshop-energy-drive.png',
    alt: 'Energy & Drive Workshop — solar car and lightbulb',
    skills: ['Solar Energy', 'Electric Circuits', 'Build a Car!'],
  },
  {
    name: 'Snap Circuits',
    emoji: '🔌',
    tagline: 'Snap, click, light up!',
    description:
      'No soldering needed! Snap colorful pieces together to build radios, alarms, and fun gadgets. Every click teaches you how electricity flows.',
    grades: 'Ages 6+',
    icon: Cpu,
    color: 'from-blue-500 to-cyan-400',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    img: '/youth/workshop-snap-circuits.png',
    alt: 'Snap Circuits Workshop — colorful circuit board',
    skills: ['Circuit Basics', 'Sound & Alarms', 'Build a Radio!'],
  },
  {
    name: 'Mechanic Motion',
    emoji: '🦕',
    tagline: 'Gears, dinos, and trucks!',
    description:
      'Make things move with gears and motors! Build mechanical dinosaurs and monster trucks while learning the basics of engineering.',
    grades: 'Ages 8+',
    icon: Cog,
    color: 'from-green-500 to-lime-400',
    bg: 'bg-green-50',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-700',
    img: '/youth/workshop-mechanic-motion.png',
    alt: 'Mechanic Motion Workshop — dinosaur robot and monster truck',
    skills: ['Gears & Levers', 'Motor Basics', 'Build a Dino!'],
  },
  {
    name: 'Robotics',
    emoji: '🤖',
    tagline: 'Build your own robot!',
    description:
      'Program cute robots to wave, dance, and solve mazes! Learn the basics of AI and robotics through hands-on challenges and mini-competitions.',
    grades: '⭐ Advanced',
    prereq: 'Requires full completion of Energy & Drive, Snap Circuits, and Mechanic Motion',
    icon: Bot,
    color: 'from-purple-500 to-indigo-400',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-700',
    img: '/youth/workshop-robotics.png',
    alt: 'Robotics Workshop — cute friendly robots',
    skills: ['Robot Programming', 'Sensors & AI', 'Robot Challenge!'],
  },
]

const funFacts = [
  { icon: Star,   text: 'Take your project home!',     color: 'text-yellow-500' },
  { icon: Heart,  text: 'Safe & beginner-friendly',    color: 'text-pink-500'   },
  { icon: Trophy, text: 'Certificate of completion',   color: 'text-amber-500'  },
  { icon: Rocket, text: 'New skills every session',    color: 'text-blue-500'   },
]

export default function YouthProgramPage() {
  return (
    <div className="bg-white">

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative py-16 lg:py-24 bg-gradient-to-b from-sky-100 via-blue-50 to-white overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-yellow-200 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-200 rounded-full blur-3xl opacity-30 translate-x-1/2 -translate-y-1/2" />

        <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-6">
            <GraduationCap className="w-4 h-4" />
            K–12 STEM Workshops
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-4">
            🚀 Learn. Build.{' '}
            <span className="text-blue-600">Have a Blast!</span>
          </h1>

          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            Hands-on workshops where kids build <strong>real gadgets</strong>,
            program <strong>real robots</strong>, and take their creations
            <strong> home</strong>. No experience needed — just curiosity!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white text-lg rounded-2xl px-8 py-6 shadow-lg shadow-blue-200">
              <Link href="/workshops">🎉 See Upcoming Workshops</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg rounded-2xl px-8 py-6 border-2">
              <Link href="/contact">📬 Contact Us</Link>
            </Button>
          </div>

          {/* Fun fact badges */}
          <div className="flex flex-wrap justify-center gap-4">
            {funFacts.map(({ icon: Icon, text, color }) => (
              <div key={text} className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100 text-sm font-medium text-slate-700">
                <Icon className={`w-4 h-4 ${color}`} />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workshop Cards ────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">
              🎨 Choose Your Adventure
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              Four awesome workshop tracks — pick the one that sounds the coolest!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {workshops.map((w) => {
              const Icon = w.icon
              return (
                <div
                  key={w.name}
                  className={`rounded-3xl overflow-hidden border-2 ${w.border} ${w.bg} shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
                >
                  {/* Workshop image — padded top so all cards align */}
                  <div className="p-4 pb-0">
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden">
                      <Image
                        src={w.img}
                        alt={w.alt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 50vw"
                      />
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{w.emoji}</span>
                        <div>
                          <h3 className="text-xl font-extrabold text-slate-900">{w.name} Workshop</h3>
                          <p className={`text-sm font-semibold px-2.5 py-0.5 rounded-full w-fit mt-1 ${w.badge}`}>{w.grades}</p>
                        </div>
                      </div>
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${w.color} flex items-center justify-center shadow-md shrink-0`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>

                    <p className="text-slate-600 leading-relaxed">{w.description}</p>

                    {/* Prerequisite notice */}
                    {'prereq' in w && (
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700 font-medium">
                        <span className="shrink-0">📋</span>
                        {(w as typeof w & { prereq: string }).prereq}
                      </div>
                    )}

                    {/* Skills chips */}
                    <div className="flex flex-wrap gap-2">
                      {w.skills.map((skill) => (
                        <span key={skill} className="flex items-center gap-1 text-xs font-semibold bg-white rounded-full px-3 py-1 border border-gray-200 text-slate-700">
                          <ChevronRight className="w-3 h-3 text-blue-400" />
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-b from-sky-50 to-white">
        <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">
              🗺️ How It Works
            </h2>
            <p className="text-lg text-slate-500">Three steps from sign-up to genius!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { step: '1', emoji: '📋', title: 'Pick a Workshop', desc: 'Choose from Energy, Circuits, Motion, or Robotics. All levels welcome!' },
              { step: '2', emoji: '🔧', title: 'Build & Explore', desc: 'Work with real kits, guided by friendly instructors in a fun lab setting.' },
              { step: '3', emoji: '🎁', title: 'Take It Home!', desc: 'Every student keeps their project and gets a certificate. Show it off!' },
            ].map(({ step, emoji, title, desc }) => (
              <div key={step} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-full bg-blue-600 text-white text-2xl font-extrabold flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
                  {step}
                </div>
                <div className="text-4xl mb-3">{emoji}</div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-600">
        <div className="container max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="text-5xl">🎉</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Ready to Build Something Amazing?
          </h2>
          <p className="text-blue-100 text-lg max-w-xl mx-auto">
            Workshops run year-round. Spots fill up fast — register today or reach out
            to schedule a session for your group!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-blue-50 text-lg rounded-2xl px-8 py-6 font-bold shadow-lg">
              <Link href="/workshops">🚀 View Workshops</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 text-lg rounded-2xl px-8 py-6">
              <Link href="/contact">📬 Get in Touch</Link>
            </Button>
          </div>
        </div>
      </section>

    </div>
  )
}
