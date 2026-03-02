'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Terminal, Zap, ShieldCheck, Crown, ArrowUp, ArrowDown,
  ChevronDown, ChevronUp, Cpu, Server, Users, HardDrive, BookOpen,
} from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useCartStore, type BillingPeriod } from '@/store/useCartStore'
import { formatCurrency } from '@/lib/utils'
import { getStudentVerificationStatus } from '@/app/actions/student'
import { cancelSubscription, activateFreeSubscription, changeSubscription } from '@/app/actions/subscription'
import { toast } from 'sonner'

/* ── Feature detail type ── */
interface FeatureDetail {
  title: string
  description: string
  icon: typeof Terminal
}

/* ── Static feature map keyed by plan name ── */
const PLAN_FEATURES: Record<string, { features: FeatureDetail[]; icon: typeof Terminal }> = {
  Free: {
    icon: Terminal,
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
  },
  Basic: {
    icon: Zap,
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
  },
  Pro: {
    icon: ShieldCheck,
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
  },
  Premium: {
    icon: Crown,
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
  },
}

/* ── Props types ── */
interface SerializedPlan {
  id: string
  name: string
  level: number
  monthlyPrice: number
  annualTotalPrice: number
  description: string
  highlights: string[]
  sortOrder: number
}

interface SerializedSubscription {
  id: string
  userId: string
  planId: string
  stripeSubscriptionId: string | null
  status: string
  billingPeriod: string
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  canceledAt: string | null
  createdAt: string | null
  plan: SerializedPlan
}

interface SubscriptionClientProps {
  plans: SerializedPlan[]
  currentSubscription: SerializedSubscription | null
}

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

export default function SubscriptionClient({ plans, currentSubscription }: SubscriptionClientProps) {
  const addItem = useCartStore((s) => s.addItem)
  const clearCart = useCartStore((s) => s.clearCart)
  const router = useRouter()

  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly')
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null)
  const [isStudent, setIsStudent] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [freePlanConfirming, setFreePlanConfirming] = useState(false)
  const [freePlanLoading, setFreePlanLoading] = useState(false)
  const [changePlanConfirming, setChangePlanConfirming] = useState<SerializedPlan | null>(null)
  const [changePlanLoading, setChangePlanLoading] = useState(false)

  useEffect(() => {
    getStudentVerificationStatus()
      .then((result) => {
        if (result.status === 'APPROVED') setIsStudent(true)
      })
      .catch(() => {})
  }, [])

  const STUDENT_DISCOUNT = 0.85 // 15% off

  const isPendingCancel = currentSubscription?.canceledAt != null
  const activePlan = currentSubscription
    ? plans.find((p) => p.id === currentSubscription.planId) ?? null
    : null

  const getBasePrice = (plan: SerializedPlan) => {
    if (plan.monthlyPrice === 0) return 0
    return billingPeriod === 'annual' ? plan.annualTotalPrice : plan.monthlyPrice
  }

  const getStudentPrice = (plan: SerializedPlan) => {
    const base = getBasePrice(plan)
    if (base === 0 || !isStudent) return null
    return Math.round(base * STUDENT_DISCOUNT * 100) / 100
  }

  const getFinalPrice = (plan: SerializedPlan) => {
    return getStudentPrice(plan) ?? getBasePrice(plan)
  }

  const getDisplayPrice = (plan: SerializedPlan) => {
    if (plan.monthlyPrice === 0) return '$0'
    return `$${formatCurrency(getFinalPrice(plan))}`
  }

  const getOriginalDisplayPrice = (plan: SerializedPlan) => {
    if (plan.monthlyPrice === 0) return null
    if (billingPeriod === 'annual') {
      // Show full annual price (monthly * 12) before 10% discount
      const fullAnnual = Math.round(plan.monthlyPrice * 12 * 100) / 100
      if (isStudent) {
        // Student sees full annual crossed out (discount stacks)
        return `$${formatCurrency(fullAnnual)}`
      }
      return `$${formatCurrency(fullAnnual)}`
    }
    if (!isStudent) return null
    return `$${formatCurrency(getBasePrice(plan))}`
  }

  const getDiscountLabel = (plan: SerializedPlan) => {
    if (plan.monthlyPrice === 0) return null
    if (billingPeriod === 'annual' && isStudent) return 'Annual -10% + Student -15%'
    if (billingPeriod === 'annual') return 'Save 10%'
    if (isStudent) return 'Student -15%'
    return null
  }

  const getPriceSuffix = (plan: SerializedPlan) => {
    if (plan.monthlyPrice === 0) return ''
    return billingPeriod === 'annual' ? '/year' : '/mo'
  }

  const handleSubscribe = (plan: SerializedPlan) => {
    if (plan.monthlyPrice === 0) {
      setFreePlanConfirming(true)
      return
    }

    // Paid→Paid plan change: use in-place subscription update
    if (currentSubscription?.stripeSubscriptionId && plan.monthlyPrice > 0) {
      setChangePlanConfirming(plan)
      return
    }

    // New subscription (no existing Stripe subscription): go through checkout
    const price = getFinalPrice(plan)
    clearCart()
    addItem({
      productId: `plan-${plan.name.toLowerCase()}-${billingPeriod}`,
      name: `${plan.name} Plan (${billingPeriod === 'annual' ? 'Annual' : 'Monthly'})`,
      price,
      description: plan.description,
      type: 'subscription',
      billingPeriod,
      monthlyPrice: plan.monthlyPrice,
      annualPrice: plan.annualTotalPrice,
      planId: plan.name.toLowerCase(),
    })
    router.push('/checkout')
  }

  const handleCancelSubscription = async () => {
    if (!currentSubscription?.stripeSubscriptionId) return
    setCanceling(true)
    const result = await cancelSubscription(currentSubscription.stripeSubscriptionId)
    setCanceling(false)
    if (result.success) {
      toast.success('Subscription canceled successfully')
      router.refresh()
    } else {
      toast.error(result.error || 'Failed to cancel subscription')
    }
  }

  const toggleExpand = (planId: string) => {
    setExpandedPlan((prev) => (prev === planId ? null : planId))
  }

  const isActive = (plan: SerializedPlan) => activePlan?.id === plan.id

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
      {!activePlan && (
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

      {/* Plans — vertical stack */}
      <div className="flex flex-col gap-5 max-w-3xl mx-auto">
        {plans.map((plan) => {
          const active = isActive(plan)
          const isPaid = plan.monthlyPrice > 0
          const isExpanded = expandedPlan === plan.id
          const planMeta = PLAN_FEATURES[plan.name]
          const PlanIcon = planMeta?.icon ?? Terminal
          const features = planMeta?.features ?? []

          let buttonVariant: 'upgrade' | 'downgrade' | 'active' | 'subscribe' = 'subscribe'
          if (activePlan) {
            if (active) buttonVariant = 'active'
            else if (plan.level > activePlan.level) buttonVariant = 'upgrade'
            else buttonVariant = 'downgrade'
          }

          /* ── Active plan: always-expanded card ── */
          if (active && currentSubscription) {
            return (
              <Card
                key={plan.id}
                className={`relative border-2 rounded-2xl overflow-hidden ${
                  isPendingCancel
                    ? 'border-amber-400 bg-amber-50/30'
                    : 'border-blue-600 bg-blue-50/30'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-2xl text-slate-900">
                        {plan.name} Plan
                      </CardTitle>
                      {isPendingCancel ? (
                        <Badge className="bg-amber-100 text-amber-700 text-xs px-2.5 py-0.5">
                          Cancels at period end
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-600 text-white text-xs px-2.5 py-0.5">
                          Active
                        </Badge>
                      )}
                    </div>
                    {currentSubscription.currentPeriodStart && currentSubscription.currentPeriodEnd ? (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 ml-auto">
                        <p className="text-xs text-blue-700 whitespace-nowrap">
                          <span className="font-semibold">Billing:</span>{' '}
                          {formatShortDate(currentSubscription.currentPeriodStart)} &ndash;{' '}
                          {formatShortDate(currentSubscription.currentPeriodEnd)}
                        </p>
                      </div>
                    ) : currentSubscription.createdAt ? (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 ml-auto">
                        <p className="text-xs text-blue-700 whitespace-nowrap">
                          <span className="font-semibold">Since:</span>{' '}
                          {formatShortDate(currentSubscription.createdAt)}
                        </p>
                      </div>
                    ) : null}
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

                  {/* Nested feature cards */}
                  {features.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-3">What&apos;s included</h3>
                      <FeatureCards features={features} />
                    </div>
                  )}

                  {/* Pending cancel notice */}
                  {isPendingCancel && currentSubscription.currentPeriodEnd && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-sm text-amber-800">
                        Your subscription has been canceled. You can continue using all plan features
                        until <span className="font-semibold">{formatDate(currentSubscription.currentPeriodEnd)}</span>.
                        No further charges will be made.
                      </p>
                    </div>
                  )}

                  {/* Action row */}
                  {isPaid && !isPendingCancel && currentSubscription?.stripeSubscriptionId && (
                    <div className="flex items-center gap-3 pt-1">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50"
                            disabled={canceling}
                          >
                            {canceling ? 'Canceling...' : 'Cancel Subscription'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel your <strong>{plan.name}</strong> plan?
                              {currentSubscription.currentPeriodEnd
                                ? <> You will still have access until <strong>{formatDate(currentSubscription.currentPeriodEnd)}</strong>. No further charges will be made after that.</>
                                : <> Your subscription will not renew at the end of the current billing period.</>
                              }
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleCancelSubscription}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Yes, Cancel
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
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
                    <PlanIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                    <p className="text-sm text-slate-500">{plan.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5 sm:flex-shrink-0">
                  <div className="text-right">
                    {getOriginalDisplayPrice(plan) && (
                      <div className="flex items-center justify-end gap-2 mb-0.5">
                        <span className="text-sm text-slate-400 line-through">
                          {getOriginalDisplayPrice(plan)}{getPriceSuffix(plan)}
                        </span>
                        {getDiscountLabel(plan) && (
                          <Badge className="bg-blue-600 text-white text-[10px] px-1.5 py-0">
                            {getDiscountLabel(plan)}
                          </Badge>
                        )}
                      </div>
                    )}
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
                    >
                      <ArrowUp className="w-4 h-4 mr-1.5" />
                      Upgrade
                    </Button>
                  ) : buttonVariant === 'downgrade' ? (
                    <Button
                      variant="outline"
                      className="border-slate-300 text-slate-600 hover:bg-slate-50 min-w-[120px]"
                      onClick={() => handleSubscribe(plan)}
                    >
                      <ArrowDown className="w-4 h-4 mr-1.5" />
                      Downgrade
                    </Button>
                  ) : (
                    <Button
                      className={`min-w-[120px] ${
                        isPaid
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                      onClick={() => handleSubscribe(plan)}
                    >
                      {isPaid ? 'Subscribe' : 'Get Started'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Highlights + expand toggle */}
              <div className="px-6 pb-4">
                <ul className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                  {(plan.highlights as string[]).map((h, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="text-blue-500">&#10003;</span>
                      {h}
                    </li>
                  ))}
                </ul>

                {features.length > 0 && (
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
                )}
              </div>

              {/* Expanded: nested feature cards */}
              {isExpanded && features.length > 0 && (
                <div className="px-6 pb-6 pt-1">
                  <FeatureCards features={features} />
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Free Plan Confirmation Dialog */}
      <AlertDialog open={freePlanConfirming} onOpenChange={setFreePlanConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate Free Plan</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;re about to activate the <strong>Free</strong> plan. This includes a standard
              Linux VM (1 vCPU, 512MB RAM, 25GB SSD) that will be provisioned automatically.
              No payment is required.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={freePlanLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={freePlanLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={async (e) => {
                e.preventDefault()
                setFreePlanLoading(true)
                const result = await activateFreeSubscription()
                setFreePlanLoading(false)
                if (result.success) {
                  setFreePlanConfirming(false)
                  toast.success('Free plan activated! Your VM is being provisioned.')
                  router.refresh()
                } else {
                  toast.error(result.error || 'Failed to activate free plan')
                }
              }}
            >
              {freePlanLoading ? 'Activating...' : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Plan Change (Upgrade/Downgrade) Confirmation Dialog */}
      <AlertDialog
        open={changePlanConfirming !== null}
        onOpenChange={(open) => { if (!open) setChangePlanConfirming(null) }}
      >
        <AlertDialogContent>
          {changePlanConfirming && (() => {
            const isUpgrade = activePlan ? changePlanConfirming.level > activePlan.level : false
            return (
              <>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {isUpgrade ? 'Upgrade' : 'Downgrade'} to {changePlanConfirming.name} Plan
                  </AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-3">
                      {isUpgrade ? (
                        <p>
                          You will be charged the prorated difference for the remainder of your
                          current billing period immediately.
                        </p>
                      ) : (
                        <p>
                          A prorated credit will be applied to your next invoice.
                        </p>
                      )}
                      <p className="font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        All existing VMs will be stopped and deleted. New VMs will be provisioned
                        for the {changePlanConfirming.name} plan.
                      </p>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={changePlanLoading}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={changePlanLoading}
                    className={isUpgrade
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-600 hover:bg-slate-700 text-white'
                    }
                    onClick={async (e) => {
                      e.preventDefault()
                      if (!currentSubscription?.stripeSubscriptionId) return
                      setChangePlanLoading(true)
                      const result = await changeSubscription(
                        currentSubscription.stripeSubscriptionId,
                        changePlanConfirming.name,
                        getFinalPrice(changePlanConfirming),
                        billingPeriod,
                        isUpgrade ? 'upgrade' : 'downgrade'
                      )
                      setChangePlanLoading(false)
                      if (result.success) {
                        setChangePlanConfirming(null)
                        if (result.error) {
                          toast.warning(result.error)
                        } else {
                          toast.success(`Successfully ${isUpgrade ? 'upgraded' : 'downgraded'} to ${changePlanConfirming.name} plan`)
                        }
                        router.refresh()
                      } else {
                        toast.error(result.error || 'Failed to change plan')
                      }
                    }}
                  >
                    {changePlanLoading
                      ? (isUpgrade ? 'Upgrading...' : 'Downgrading...')
                      : `Confirm ${isUpgrade ? 'Upgrade' : 'Downgrade'}`
                    }
                  </AlertDialogAction>
                </AlertDialogFooter>
              </>
            )
          })()}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
