import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  ExternalLink,
  Terminal,
  Shield,
  Cloud,
  Brain,
  ArrowRight,
  BookOpen,
  MessageSquare,
} from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'

const KnowledgeNetworkCanvas = dynamic(
  () =>
    import('@/components/knowledge-base/KnowledgeNetworkCanvas').then(
      (mod) => mod.KnowledgeNetworkCanvas
    ),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" />
    ),
  }
)

const categories = [
  {
    title: 'Linux',
    description:
      'Command-line fundamentals, system administration, shell scripting, and server management.',
    icon: Terminal,
    href: 'https://docs.innozverse.com/linux',
  },
  {
    title: 'Cybersecurity',
    description:
      'Network defense, ethical hacking, threat analysis, and security best practices.',
    icon: Shield,
    href: 'https://docs.innozverse.com/cyber-security',
  },
  {
    title: 'Cloud & DevOps',
    description:
      'Cloud platforms, CI/CD pipelines, containerization, and infrastructure as code.',
    icon: Cloud,
    href: 'https://docs.innozverse.com/programming',
  },
  {
    title: 'AI & Machine Learning',
    description:
      'Neural networks, NLP, computer vision, and hands-on model training guides.',
    icon: Brain,
    href: 'https://docs.innozverse.com/artificial-intelligent-ai',
  },
]

export default function KnowledgeBasePage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        <div className="absolute inset-0">
          <KnowledgeNetworkCanvas />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <span className="inline-block rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-300">
            Open-Source Curriculum
          </span>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Master the Future of Tech.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
            Dive into our growing library of hands-on guides covering Linux,
            cybersecurity, cloud engineering, artificial intelligence, and
            more — with new technologies being added all the time.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="https://docs.innozverse.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-blue-700"
            >
              Launch Full Documentation
              <ExternalLink className="h-4 w-4" />
            </a>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-500 px-6 py-3 text-[15px] font-medium text-slate-200 transition-colors hover:border-slate-400 hover:text-white"
            >
              Get Lab Access
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Explore by Topic
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Structured learning paths across the most in-demand technology
              domains.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat) => (
              <a
                key={cat.title}
                href={cat.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Card className="h-full border-gray-200 bg-white hover:border-blue-300">
                  <CardHeader>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                      <cat.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{cat.title}</CardTitle>
                    <CardDescription className="text-sm text-slate-500">
                      {cat.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Always Growing */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <BookOpen className="mx-auto h-10 w-10 text-blue-600" />
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Always Growing
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Our curriculum is open-source and community-driven. New modules,
            labs, and challenges are added every week so there&apos;s always
            something new to learn.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="https://docs.innozverse.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-blue-700"
            >
              Start Reading
              <ExternalLink className="h-4 w-4" />
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-6 py-3 text-[15px] font-medium text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900"
            >
              Suggest a Topic
              <MessageSquare className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
