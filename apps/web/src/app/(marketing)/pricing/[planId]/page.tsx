'use client'

import { useEffect, useState } from 'react'
import { notFound, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Terminal, Server, ShieldCheck, Crown, Cpu, HardDrive, Network, Clock, Users, Zap, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { formatCurrency } from '@/lib/utils'
import { getStudentVerificationStatus } from '@/app/actions/student'

const HomeNetworkCanvas = dynamic(
  () =>
    import('@/components/home/HomeNetworkCanvas').then(
      (mod) => mod.HomeNetworkCanvas
    ),
  { ssr: false }
)

interface PlanData {
  id: string
  name: string
  price: string
  monthlyAmount: number
  description: string
  icon: typeof Terminal
  features: {
    title: string
    description: string
    icon: typeof Check
  }[]
  faqs: {
    question: string
    answer: string
  }[]
}

const planData: Record<string, PlanData> = {
  free: {
    id: 'free',
    name: 'Free',
    price: '$0/month',
    monthlyAmount: 0,
    description: 'Free for students only. Verify with a valid .edu email to get started with cloud development.',
    icon: Terminal,
    features: [
      {
        title: 'Standard Linux VM Specifications',
        description: 'Get access to 1 Linux virtual machine with 1 vCPU and 512MB RAM. Perfect for learning the basics, running small projects, or testing code. The VM runs the latest version of Ubuntu with common development tools pre-installed.',
        icon: Cpu,
      },
      {
        title: 'Community Access',
        description: 'Join our active Discord community with thousands of students. Get help with coding problems, share your projects, participate in monthly hackathons, and connect with peers learning the same technologies.',
        icon: Users,
      },
      {
        title: 'Public Documentation & Tutorials',
        description: 'Access our comprehensive learning library with step-by-step guides, video tutorials, and reference documentation. Learn everything from Linux basics to advanced DevOps practices.',
        icon: BookOpen,
      },
      {
        title: '25GB SSD Disk',
        description: 'Store your projects, code, and configurations with 25GB of persistent SSD storage.',
        icon: HardDrive,
      },
    ],
    faqs: [
      {
        question: 'How long can I use the Free plan?',
        answer: 'Forever! There are no time limits on the Free plan. As long as you remain an active student, you can use your VM indefinitely.',
      },
      {
        question: 'Can I upgrade from Free to a paid plan?',
        answer: 'Absolutely! You can upgrade anytime from your dashboard. Your existing VM and data will be preserved, and you\'ll immediately gain access to additional resources.',
      },
      {
        question: 'What happens if I exceed the 25GB storage limit?',
        answer: 'You\'ll receive email notifications when you reach 80% and 90% capacity. Once you hit the limit, you can either clean up files or upgrade to a paid plan for more storage.',
      },
      {
        question: 'Can I install my own software on the VM?',
        answer: 'Yes! You have full root access to your VM. Install any packages, tools, or frameworks you need using apt, snap, or compile from source.',
      },
    ],
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    price: '$19.99/month',
    monthlyAmount: 19.99,
    description: 'The perfect starting point for cybersecurity students. Get a dedicated Kali Linux environment without the Pro price tag.',
    icon: Zap,
    features: [
      {
        title: 'Core Compute',
        description: '1 Standard Linux VM (2 vCPU, 2GB RAM, 25GB NVMe SSD) for general development. Run your code, build projects, and learn system administration with the latest Ubuntu environment.',
        icon: Server,
      },
      {
        title: 'Security Lab (The Key Value)',
        description: '1 Kali Linux VM (2 vCPU, 2GB RAM, 32GB NVMe SSD) pre-loaded with standard penetration testing tools including Nmap, Metasploit, Burp Suite, Wireshark, and John the Ripper. Perfect for cybersecurity coursework and CTF practice.',
        icon: ShieldCheck,
      },
      {
        title: 'Access',
        description: 'Connect from anywhere with secure SSH access. No additional software required.',
        icon: Terminal,
      },
      {
        title: 'Support',
        description: 'Community Forum Support with access to our active Discord server. Get help from thousands of students and developers, share projects, and participate in monthly CTF events.',
        icon: Users,
      },
    ],
    faqs: [
      {
        question: 'Why this plan?',
        answer: 'Upgrades you from the Free plan by adding a persistent Security Lab (Kali) for your coursework. This is the most affordable way to get dedicated access to penetration testing tools without paying for Pro-level features you might not need yet.',
      },
      {
        question: 'What makes Basic different from Free?',
        answer: 'Basic includes a dedicated Kali Linux VM (2 vCPU, 2GB RAM, 32GB NVMe SSD) with security tools, plus a Standard VM with 2 vCPU, 2GB RAM, and 25GB NVMe SSD. Free only provides a single standard Linux VM without security-focused tools.',
      },
      {
        question: 'How does Basic compare to Pro?',
        answer: 'Pro ($29.99/mo) includes 2 standard Linux VMs plus 1 Kali VM (vs Basic\'s 1+1) and community support. Basic is perfect if you primarily need the Kali environment and don\'t require additional VMs.',
      },
      {
        question: 'Can I run both VMs simultaneously?',
        answer: 'Yes! Both your Standard Linux VM and Kali Linux VM can run at the same time. This is useful for setting up vulnerable test environments or running target machines for penetration testing practice.',
      },
      {
        question: 'Can I add more VMs to my Basic plan?',
        answer: 'Need more resources? We recommend upgrading to a higher-level subscription. Pro ($29.99/mo) includes 2 standard + 1 Kali VMs, and Premium ($59.99/mo) offers 3 standard + 2 Kali VMs with priority support.',
      },
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: '$29.99/month',
    monthlyAmount: 29.99,
    description: 'Built for serious developers and security professionals.',
    icon: ShieldCheck,
    features: [
      {
        title: 'Kali Linux Security Lab',
        description: 'Pre-configured Kali Linux VM (2 vCPU, 2GB RAM, 32GB NVMe SSD) with 500+ penetration testing tools including Metasploit, Burp Suite, Wireshark, Nmap, John the Ripper, and Aircrack-ng. Perfect for ethical hacking, security research, and CTF competitions. Includes quarterly tool updates.',
        icon: ShieldCheck,
      },
      {
        title: '2 Standard Linux VMs',
        description: 'Run two concurrent VMs (2 vCPU, 2GB RAM, 25GB NVMe SSD each). Great for separating development and testing environments, or running microservices.',
        icon: Server,
      },
      {
        title: 'Priority Support',
        description: 'Get help during business hours via email and chat. Direct access to senior support engineers who understand your technical stack.',
        icon: Users,
      },
    ],
    faqs: [
      {
        question: 'Can I upgrade from Pro to Premium mid-month?',
        answer: 'Yes! You\'ll only pay the prorated difference. Your existing VMs and data carry over seamlessly.',
      },
      {
        question: 'What is the Kali Linux VM used for?',
        answer: 'Kali is specialized for cybersecurity work: penetration testing, vulnerability assessments, digital forensics, and security research. It\'s ideal for students in cybersecurity programs or preparing for certifications like CEH or OSCP.',
      },
      {
        question: 'How does Priority Support work?',
        answer: 'Submit tickets via dashboard or email. Our team responds during business hours with actionable solutions.',
      },
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: '$59.99/month',
    monthlyAmount: 59.99,
    description: 'The ultimate toolkit for professionals and advanced learners.',
    icon: Crown,
    features: [
      {
        title: '3 Standard + 2 Kali VMs',
        description: 'Run up to 3 standard Linux VMs (4 vCPU, 4GB RAM, 50GB NVMe SSD each) and 2 Kali Linux VMs (4 vCPU, 4GB RAM, 50GB NVMe SSD each) concurrently. Perfect for complex development workflows, isolated testing environments, or running multiple security scans simultaneously.',
        icon: Server,
      },
      {
        title: 'Priority Support',
        description: 'Get faster responses when you need help. Premium members receive priority handling on all support requests, ensuring your issues are resolved quickly so you can stay focused on your work.',
        icon: Zap,
      },
      {
        title: 'Custom VM Configurations',
        description: 'Request custom VM images with your preferred OS (CentOS, Fedora, Arch, Debian, etc.), pre-installed tools, and configurations. Our team builds and maintains your custom images. Turnaround time: 48 hours.',
        icon: Cpu,
      },
      {
        title: 'Dedicated Support Channel',
        description: 'Private Discord channel with direct access to our engineering team for complex issues.',
        icon: Users,
      },
    ],
    faqs: [
      {
        question: 'Can I run more than 5 VMs total?',
        answer: 'Yes! You can request additional resources beyond your 5 included instances. Contact us to add more VMs at a great price.',
      },
      {
        question: 'How do custom VM configurations work?',
        answer: 'Submit a request describing your ideal setup (OS, tools, configs). Our team builds the image, tests it, and delivers it within 48 hours. You can request updates anytime.',
      },
      {
        question: 'What happens if I downgrade from Premium?',
        answer: 'You can downgrade to Pro or Basic anytime. Your VMs will remain active, but you\'ll lose access to Premium features like custom configurations and the dedicated Discord channel.',
      },
    ],
  },
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const STUDENT_DISCOUNT = 0.85 // 15% off

export default function PlanDetailPage({ params }: { params: { planId: string } }) {
  const plan = planData[params.planId]
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [isStudent, setIsStudent] = useState(false)
  const [liveMonthlyPrice, setLiveMonthlyPrice] = useState<number | null>(null)

  useEffect(() => {
    // Fetch actual price from API
    fetch(`${apiUrl}/api/v1/subscriptions/plans`)
      .then((res) => res.json())
      .then((data) => {
        const match = (data.plans as any[])?.find(
          (p: any) => p.name.toLowerCase() === params.planId.toLowerCase()
        )
        if (match) setLiveMonthlyPrice(match.monthlyPrice)
      })
      .catch(() => {})

    // Check student status
    getStudentVerificationStatus()
      .then((result) => {
        if (result.status === 'APPROVED') setIsStudent(true)
      })
      .catch(() => {})
  }, [params.planId])

  if (!plan) {
    notFound()
  }

  const monthlyPrice = liveMonthlyPrice ?? plan.monthlyAmount
  const isPaid = monthlyPrice > 0
  const studentPrice = isPaid && isStudent ? Math.round(monthlyPrice * STUDENT_DISCOUNT * 100) / 100 : null

  const handleSubscribe = () => {
    if (!isPaid) {
      router.push(isAuthenticated ? '/user/subscription' : '/auth/register')
      return
    }

    if (isAuthenticated) {
      router.push('/user/subscription')
    } else {
      router.push('/auth/login?callbackUrl=%2Fuser%2Fsubscription')
    }
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 overflow-hidden">
        <div className="absolute inset-0">
          <HomeNetworkCanvas />
        </div>
        <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
                <plan.icon className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-5xl sm:text-6xl font-bold text-slate-900">
                  {plan.name} Plan
                </h1>
                <div className="mt-2 space-y-1">
                  {studentPrice !== null ? (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="text-lg text-slate-400 line-through">
                          ${formatCurrency(monthlyPrice)}/mo
                        </span>
                        <Badge className="bg-blue-600 text-white text-xs px-2 py-0.5">
                          Student -15%
                        </Badge>
                      </div>
                      <p className="text-2xl text-blue-600 font-bold">
                        ${formatCurrency(studentPrice)}/month
                      </p>
                      <p className="text-xs text-green-600 font-medium">
                        You save ${formatCurrency(monthlyPrice - studentPrice)}/mo
                      </p>
                    </>
                  ) : (
                    <p className="text-2xl text-blue-600 font-bold">
                      {isPaid ? `$${formatCurrency(monthlyPrice)}/month` : '$0/month'}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xl text-slate-600 leading-relaxed">
              {plan.description}
            </p>

            <div className="mt-8">
              <Button
                onClick={handleSubscribe}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isPaid ? 'Subscribe' : 'Get Started Free'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Deep Dive Features */}
      <section className="py-24 bg-white">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-slate-900 mb-12">
              What's Included
            </h2>
            <div className="space-y-8">
              {plan.features.map((feature, index) => (
                <Card key={index} className="border-2 border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-2xl text-slate-900 mb-3">
                          {feature.title}
                        </CardTitle>
                        <p className="text-slate-600 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Plan-Specific FAQs */}
      <section className="py-24 bg-gradient-to-br from-blue-50 via-white to-blue-50/30">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-slate-900 mb-12 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {plan.faqs.map((faq, index) => (
                <Card key={index} className="bg-white border-2 border-gray-200 rounded-2xl shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl text-slate-900">
                      {faq.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Usage Policy Notice */}
      <section className="py-12 bg-amber-50 border-y border-amber-200">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white border-2 border-amber-300 rounded-2xl p-6 shadow-md">
              <div className="flex items-center justify-center gap-2 mb-3">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="font-bold text-amber-800 text-center">Acceptable Use Policy</h3>
              </div>
              <p className="text-sm text-amber-700 leading-relaxed text-center mb-4">
                All virtual machines provided by Innozverse are intended strictly for educational and learning purposes. The following activities are prohibited:
              </p>
              <ul className="text-sm text-amber-800 space-y-1.5 max-w-xl mx-auto">
                <li className="flex items-start gap-2"><span className="text-red-500 font-bold mt-0.5">&#x2715;</span> Production workloads or commercial use</li>
                <li className="flex items-start gap-2"><span className="text-red-500 font-bold mt-0.5">&#x2715;</span> Cryptocurrency mining or blockchain validation</li>
                <li className="flex items-start gap-2"><span className="text-red-500 font-bold mt-0.5">&#x2715;</span> Unauthorized scanning or attacks on external systems</li>
                <li className="flex items-start gap-2"><span className="text-red-500 font-bold mt-0.5">&#x2715;</span> Hosting public-facing services or websites</li>
                <li className="flex items-start gap-2"><span className="text-red-500 font-bold mt-0.5">&#x2715;</span> Distributing malware or illegal content</li>
                <li className="flex items-start gap-2"><span className="text-red-500 font-bold mt-0.5">&#x2715;</span> Reselling or sharing VM access with others</li>
              </ul>
              <p className="text-xs text-amber-600 text-center mt-4 font-medium">
                Violation of these policies may result in immediate account suspension. All security testing must be performed within your own lab environment only.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white border-t-2 border-gray-200">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  Ready to get started?
                </h3>
                <p className="text-slate-600">
                  Join thousands of students building their future with Innozverse.
                </p>
              </div>
              <div className="flex gap-4">
                <Button asChild variant="outline" size="lg" className="border-2 border-gray-300 hover:bg-slate-100">
                  <Link href="/pricing">
                    Compare Plans
                  </Link>
                </Button>
                <Button
                  onClick={handleSubscribe}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isPaid ? 'Subscribe' : 'Get Started Free'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky CTA for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t-2 border-gray-200 shadow-lg sm:hidden z-50">
        <Button
          onClick={handleSubscribe}
          size="lg"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isPaid ? 'Subscribe' : 'Get Started Free'}
        </Button>
      </div>
    </>
  )
}
