import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Cpu,
  Wifi,
  Terminal,
  Rocket,
  ChevronRight,
  Users,
  GraduationCap,
  Trophy,
} from 'lucide-react'
import Link from 'next/link'

const workshopTracks = [
  {
    title: 'Arduino Inventors',
    grades: 'Grades 3–8',
    icon: Cpu,
    description:
      'Learn electronics fundamentals by building real circuits. Students explore sensors, LEDs, and motors while creating projects they can take home.',
    topics: ['Basic Circuits', 'Sensors & LEDs', 'Motor Control', 'Project Showcase'],
    color: 'blue',
  },
  {
    title: 'Raspberry Pi Commanders',
    grades: 'Grades 6–12',
    icon: Terminal,
    description:
      'Go beyond the browser. Program mini-computers with Python, build media servers, and learn the fundamentals of Linux and networking.',
    topics: ['Python Basics', 'Linux & CLI', 'Networking', 'Mini-Server Projects'],
    color: 'indigo',
  },
  {
    title: 'IoT Explorers',
    grades: 'Grades 9–12',
    icon: Wifi,
    description:
      'Connect the physical world to the cloud. Design smart devices, work with APIs, and build dashboards that monitor real-time sensor data.',
    topics: ['Cloud Connectivity', 'Smart Sensors', 'Data Dashboards', 'Capstone Project'],
    color: 'violet',
  },
]

const learningPath = [
  {
    level: 'Beginner',
    label: 'Discover',
    description: 'Introduction to circuits, basic coding concepts, and hands-on tinkering.',
    icon: Rocket,
  },
  {
    level: 'Intermediate',
    label: 'Build',
    description: 'Project-based learning with Arduino, Raspberry Pi, and Python programming.',
    icon: Users,
  },
  {
    level: 'Advanced',
    label: 'Innovate',
    description: 'IoT systems, cloud integration, and a capstone project for your portfolio.',
    icon: Trophy,
  },
]

export default function YouthProgramPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 bg-gradient-to-b from-blue-50 to-white overflow-hidden">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                <GraduationCap className="w-4 h-4" />
                K-12 STEM Program
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                Building the Future,{' '}
                <span className="text-blue-600">One Circuit at a Time.</span>
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
                Hands-on workshops in IoT, Robotics, and Coding for K-12 students.
                Real hardware, real projects, real skills for the next generation of innovators.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-base">
                  <Link href="#workshops">View Upcoming Workshops</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="bg-white border-gray-200 text-slate-700 hover:bg-gray-50 rounded-lg text-base">
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </div>
            </div>

            {/* Hero Image Placeholder */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl border-dashed border-2 border-blue-200 bg-blue-50 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                    <Cpu className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-sm text-blue-400 font-medium">Workshop Photo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workshop Tracks */}
      <section id="workshops" className="py-24 bg-white">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Workshop Tracks
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Three guided paths designed for different age groups and skill levels.
              Every track ends with a take-home project.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {workshopTracks.map((track) => {
              const Icon = track.icon
              return (
                <Card
                  key={track.title}
                  className="bg-white border-gray-100 rounded-2xl hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-4">
                    <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                      <Icon className="w-7 h-7 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl text-slate-900">
                      {track.title}
                    </CardTitle>
                    <span className="text-sm font-medium text-blue-600">
                      {track.grades}
                    </span>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {track.description}
                    </p>
                    <ul className="space-y-2">
                      {track.topics.map((topic) => (
                        <li
                          key={topic}
                          className="flex items-center gap-2 text-sm text-slate-700"
                        >
                          <ChevronRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Gallery Placeholder */}
      <section className="py-24 bg-blue-50">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Inside the Lab
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              A peek at what students build during our workshops.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="aspect-[4/3] rounded-2xl border-dashed border-2 border-blue-200 bg-white flex items-center justify-center"
              >
                <p className="text-sm text-blue-300 font-medium">Photo {i}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Path */}
      <section className="py-24 bg-white">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Learning Path
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              A structured progression from first-time tinkerer to confident builder.
            </p>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-blue-200 -translate-x-1/2" />

            <div className="space-y-12 md:space-y-16">
              {learningPath.map((step, index) => {
                const Icon = step.icon
                return (
                  <div
                    key={step.level}
                    className={`flex flex-col md:flex-row items-center gap-6 md:gap-12 ${
                      index % 2 === 1 ? 'md:flex-row-reverse' : ''
                    }`}
                  >
                    <div className="flex-1 text-center md:text-left">
                      <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">
                        {step.level}
                      </span>
                      <h3 className="text-2xl font-bold text-slate-900 mt-1">
                        {step.label}
                      </h3>
                      <p className="text-slate-600 mt-2 leading-relaxed">
                        {step.description}
                      </p>
                    </div>

                    {/* Circle icon node */}
                    <div className="relative z-10 w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
                      <Icon className="w-7 h-7 text-white" />
                    </div>

                    <div className="flex-1" />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-blue-50">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Ready to get started?
          </h2>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Workshops run year-round for schools, homeschool groups, and community centers.
            Get in touch to schedule a session or learn more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-base">
              <Link href="/contact">Contact Us</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-white border-gray-200 text-slate-700 hover:bg-gray-50 rounded-lg text-base">
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
