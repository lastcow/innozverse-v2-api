'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Terminal, Zap, ShieldCheck, Crown, Loader2, ArrowUp, ArrowDown,
  ChevronDown, ChevronUp, Cpu, Server, Users, HardDrive, BookOpen,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useCartStore, type BillingPeriod } from '@/store/useCartStore'
import { createCheckoutSession } from '@/app/actions/stripe'
import { fetchUserSubscription, type UserSubscription } from '@/app/actions/subscription'

/* ── Feature detail type ── */
interface FeatureDetail {
  title: string
  description: string
  icon: typeof Terminal
}

interface PlanInfo {
  id: string
  name: string
  level: number
  monthlyPrice: number
  annualTotalPrice: number
  description: string
  highlights: string[]
  features: FeatureDetail[]
  icon: typeof Terminal
}

const plans: PlanInfo[] = [
  {
    id: 'free',
    name: 'Free',
    level: 0,
    monthlyPrice: 0,
    annualTotalPrice: 0,
    description: 'Free for students only. Verify with a valid .edu email.',
    highlights: [
      '1 Standard Linux VM (1 vCPU, 512MB RAM)',
      '25GB SSD Storage',
      'Community Access',
    ],
    features: [
      {
        title: 'Standard Linux VM',
        description: '1 Linux virtual machine with 1 vCPU and 512MB RAM. Perfect for learning the basics, running small projects, or testing code with the latest Ubuntu and common dev tools pre-installed.',
        icon: Cpu,
      },
      {
        title: '25GB SSD Storage',
        description: 'Store your projects, code, and configurations with 25GB of persistent SSD storage.',
        icon: HardDrive,
      },
      {
        title: 'Community Access',
        description: 'Join our active Discord community. Get help with coding problems, share projects, and participate in monthly hackathons.',
        icon: Users,
      },
      {
        title: 'Documentation & Tutorials',
        description: 'Access our comprehensive learning library with step-by-step guides, video tutorials, and reference documentation.',
        icon: BookOpen,
      },
    ],
    icon: Terminal,
  },
  {
    id: 'basic',
    name: 'Basic',
    level: 1,
    monthlyPrice: 19.99,
    annualTotalPrice: 215.89,
    description: 'Perfect entry point for cybersecurity students.',
    highlights: [
      '1 Standard + 1 Kali VM (2 vCPU, 2GB RAM each)',
      '25GB NVMe/Ubuntu VM, 32GB NVMe/Kali VM',
      'Community Support',
    ],
    features: [
      {
        title: 'Core Compute',
        description: '1 Standard Linux VM (2 vCPU, 2GB RAM, 25GB NVMe SSD) for general development. Run your code, build projects, and learn system administration with the latest Ubuntu.',
        icon: Server,
      },
      {
        title: 'Security Lab',
        description: '1 Kali Linux VM (2 vCPU, 2GB RAM, 32GB NVMe SSD) pre-loaded with penetration testing tools including Nmap, Metasploit, Burp Suite, Wireshark, and John the Ripper.',
        icon: ShieldCheck,
      },
      {
        title: 'Secure Access',
        description: 'Connect from anywhere with secure SSH access. No additional software required.',
        icon: Terminal,
      },
      {
        title: 'Community Support',
        description: 'Access to our active Discord server. Get help from thousands of students and developers, share projects, and participate in monthly CTF events.',
        icon: Users,
      },
    ],
    icon: Zap,
  },
  {
    id: 'pro',
    name: 'Pro',
    level: 2,
    monthlyPrice: 29.99,
    annualTotalPrice: 323.89,
    description: 'For serious developers and security professionals.',
    highlights: [
      '2 Standard + 1 Kali VM (2 vCPU, 2GB RAM each)',
      '25GB NVMe/Ubuntu VM, 32GB NVMe/Kali VM',
      'Priority Support',
    ],
    features: [
      {
        title: 'Kali Linux Security Lab',
        description: 'Pre-configured Kali Linux VM (2 vCPU, 2GB RAM, 32GB NVMe SSD) with 500+ penetration testing tools including Metasploit, Burp Suite, Wireshark, Nmap, and Aircrack-ng. Includes quarterly tool updates.',
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
    icon: ShieldCheck,
  },
  {
    id: 'premium',
    name: 'Premium',
    level: 3,
    monthlyPrice: 59.99,
    annualTotalPrice: 647.89,
    description: 'The ultimate toolkit for professionals.',
    highlights: [
      '3 Standard + 2 Kali VMs (4 vCPU, 4GB RAM each)',
      '50GB NVMe/Ubuntu VM, 50GB NVMe/Kali VM',
      'Priority + Dedicated Support',
    ],
    features: [
      {
        title: '3 Standard + 2 Kali VMs',
        description: 'Run up to 3 standard Linux VMs and 2 Kali Linux VMs (4 vCPU, 4GB RAM, 50GB NVMe SSD each) concurrently. Perfect for complex workflows and running multiple security scans simultaneously.',
        icon: Server,
      },
      {
        title: 'Custom VM Configurations',
        description: 'Request custom VM images with your preferred OS (CentOS, Fedora, Arch, Debian, etc.), pre-installed tools, and configurations. Our team builds and maintains your custom images. 48-hour turnaround.',
        icon: Cpu,
      },
      {
        title: 'Priority Support',
        description: 'Premium members receive priority handling on all support requests, ensuring your issues are resolved quickly.',
        icon: Zap,
      },
      {
        title: 'Dedicated Support Channel',
        description: 'Private Discord channel with direct access to our engineering team for complex issues.',
        icon: Users,
      },
    ],
    icon: Crown,
  },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function SubscriptionPage() {
  const { user, accessToken } = useAuth()
  const addItem = useCartStore((s) => s.addItem)
  const clearCart = useCartStore((s) => s.clearCart)
  const router = useRouter()

  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly')
  const [currentSub, setCurrentSub] = useState<UserSubscription | null>(null)
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)
  const [subLoading, setSubLoading] = useState(true)
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id || !accessToken) {
      setSubLoading(false)
      return
    }
    fetchUserSubscription(user.id, accessToken)
      .then(setCurrentSub)
      .finally(() => setSubLoading(false))
  }, [user?.id, accessToken])

  const activePlanId = currentSub
    ? currentSub.planId.replace(/^plan-/, '').replace(/-(monthly|annual)$/, '')
    : null
  const activePlan = plans.find((p) => p.id === activePlanId) ?? null

  const getDisplayPrice = (plan: PlanInfo) => {
    if (plan.monthlyPrice === 0) return '$0'
    if (billingPeriod === 'annual') return `$${plan.annualTotalPrice.toFixed(2)}`
    return `$${plan.monthlyPrice.toFixed(2)}`
  }

  const getPriceSuffix = (plan: PlanInfo) => {
    if (plan.monthlyPrice === 0) return ''
    return billingPeriod === 'annual' ? '/year' : '/mo'
  }

  const handleSubscribe = async (plan: PlanInfo) => {
    if (plan.monthlyPrice === 0) {
      router.push('/user')
      return
    }
    setLoadingPlanId(plan.id)
    try {
      const price = billingPeriod === 'annual' ? plan.annualTotalPrice : plan.monthlyPrice
      clearCart()
      addItem({
        productId: `plan-${plan.id}-${billingPeriod}`,
        name: `${plan.name} Plan (${billingPeriod === 'annual' ? 'Annual' : 'Monthly'})`,
        price,
        description: plan.description,
        type: 'subscription',
        billingPeriod,
        monthlyPrice: plan.monthlyPrice,
        annualPrice: plan.annualTotalPrice,
        planId: plan.id,
      })
      const result = await createCheckoutSession(
        [
          {
            productId: `plan-${plan.id}-${billingPeriod}`,
            name: `${plan.name} Plan (${billingPeriod === 'annual' ? 'Annual' : 'Monthly'})`,
            price,
            quantity: 1,
            type: 'subscription',
            billingPeriod,
          },
        ],
        user?.id ?? ''
      )
      if (result.url) {
        window.location.href = result.url
      } else {
        setLoadingPlanId(null)
      }
    } catch {
      setLoadingPlanId(null)
    }
  }

  const toggleExpand = (planId: string) => {
    setExpandedPlan((prev) => (prev === planId ? null : planId))
  }

  const isActive = (plan: PlanInfo) => activePlan?.id === plan.id

  /* ── Shared nested feature cards ── */
  const FeatureCards = ({ features }: { features: FeatureDetail[] }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {features.map((f, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-100 bg-white p-4 space-y-2"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <f.icon className="w-4 h-4 text-blue-600" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800">{f.title}</h4>
          </div>
          <p className="text-xs leading-relaxed text-slate-500">{f.description}</p>
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Subscription</h1>
        <p className="mt-1 text-slate-500">
          {activePlan
            ? 'Manage your current plan or switch to a different one.'
            : 'Choose a plan that fits your needs.'}
        </p>
      </div>

      {/* Billing Toggle */}
      {!activePlan && !subLoading && (
        <div className="flex justify-center">
          <div className="inline-flex items-center bg-slate-100 rounded-2xl p-1.5">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                billingPeriod === 'annual'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Annual
              <span className="ml-1.5 text-xs text-green-600 font-semibold">(Save 10%)</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {subLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      )}

      {/* Plans — vertical stack */}
      {!subLoading && (
        <div className="flex flex-col gap-5 max-w-3xl mx-auto">
          {plans.map((plan) => {
            const active = isActive(plan)
            const isLoading = loadingPlanId === plan.id
            const isPaid = plan.monthlyPrice > 0
            const isExpanded = expandedPlan === plan.id

            let buttonVariant: 'upgrade' | 'downgrade' | 'active' | 'subscribe' = 'subscribe'
            if (activePlan) {
              if (active) buttonVariant = 'active'
              else if (plan.level > activePlan.level) buttonVariant = 'upgrade'
              else buttonVariant = 'downgrade'
            }

            /* ── Active plan: always-expanded card ── */
            if (active && currentSub) {
              return (
                <Card
                  key={plan.id}
                  className="relative border-2 border-blue-600 bg-blue-50/30 rounded-2xl overflow-hidden"
                >
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-2xl text-slate-900">
                          {plan.name} Plan
                        </CardTitle>
                        <Badge className="bg-blue-600 text-white text-xs px-2.5 py-0.5">
                          Active
                        </Badge>
                      </div>
                      <span className="text-sm text-slate-500">
                        {formatShortDate(currentSub.currentPeriodStart)} &ndash;{' '}
                        {formatShortDate(currentSub.currentPeriodEnd)}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-5 pb-6">
                    {/* Price */}
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-slate-900">
                        {getDisplayPrice(plan)}
                      </span>
                      <span className="text-sm text-slate-500">{getPriceSuffix(plan)}</span>
                    </div>

                    {/* Billing period */}
                    <div className="rounded-lg border border-blue-100 bg-white px-4 py-3">
                      <p className="text-sm text-slate-600">
                        <span className="font-medium text-slate-700">Current billing period:</span>{' '}
                        {formatDate(currentSub.currentPeriodStart)} &ndash;{' '}
                        {formatDate(currentSub.currentPeriodEnd)}
                      </p>
                    </div>

                    {/* Nested feature cards */}
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-3">What&apos;s included</h3>
                      <FeatureCards features={plan.features} />
                    </div>

                    {/* Action row */}
                    <div className="flex items-center gap-3 pt-1">
                      <Button
                        variant="outline"
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        Manage Plan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            }

            /* ── Inactive plan: collapsible card with nested details ── */
            return (
              <Card
                key={plan.id}
                className="border border-slate-200 bg-white rounded-2xl overflow-hidden"
              >
                {/* Summary row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <plan.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                      <p className="text-sm text-slate-500">{plan.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 sm:flex-shrink-0">
                    <div className="text-right">
                      <span className="text-2xl font-bold text-slate-900">
                        {getDisplayPrice(plan)}
                      </span>
                      <span className="text-sm text-slate-500 ml-0.5">
                        {getPriceSuffix(plan)}
                      </span>
                    </div>

                    {buttonVariant === 'upgrade' ? (
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
                        onClick={() => handleSubscribe(plan)}
                        disabled={isLoading || loadingPlanId !== null}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <ArrowUp className="w-4 h-4 mr-1.5" />
                            Upgrade
                          </>
                        )}
                      </Button>
                    ) : buttonVariant === 'downgrade' ? (
                      <Button
                        variant="outline"
                        className="border-slate-300 text-slate-600 hover:bg-slate-50 min-w-[120px]"
                        onClick={() => handleSubscribe(plan)}
                        disabled={isLoading || loadingPlanId !== null}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <ArrowDown className="w-4 h-4 mr-1.5" />
                            Downgrade
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        className={`min-w-[120px] ${
                          isPaid
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                        onClick={() => handleSubscribe(plan)}
                        disabled={isLoading || loadingPlanId !== null}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isPaid ? (
                          'Subscribe'
                        ) : (
                          'Get Started'
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Highlights + expand toggle */}
                <div className="px-6 pb-4">
                  <ul className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                    {plan.highlights.map((h, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="text-blue-500">&#10003;</span>
                        {h}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => toggleExpand(plan.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    {isExpanded ? (
                      <>
                        Hide details <ChevronUp className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        View details <ChevronDown className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>

                {/* Expanded: nested feature cards */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-1">
                    <FeatureCards features={plan.features} />
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
