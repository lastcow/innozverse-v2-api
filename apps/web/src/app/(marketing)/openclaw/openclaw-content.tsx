'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Server,
  MessageCircle,
  Brain,
  KeyRound,
  TerminalSquare,
  Puzzle,
  Check,
  Headphones,
  RefreshCw,
  Wrench,
  Users,
  ChevronRight,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  calculateFinalPrice,
  formatDiscountPercentage,
} from '@/lib/discount'
import { useCartStore } from '@/store/useCartStore'

const MONTHLY_PRICE = 49.99
const ANNUAL_DISCOUNT = 0.1

const features = [
  {
    icon: Brain,
    title: 'Your Personal AI Assistant',
    description:
      'An always-available AI that knows you, manages your tasks, answers questions, and takes action on your behalf across all your apps.',
  },
  {
    icon: MessageCircle,
    title: 'Any Chat App',
    description:
      'WhatsApp, Telegram, Discord, Slack, Signal, iMessage. Works in DMs and group chats.',
  },
  {
    icon: Brain,
    title: 'Persistent Memory',
    description:
      'Remembers you, your preferences, your context. Conversations build on each other naturally.',
  },
  {
    icon: KeyRound,
    title: 'API Control',
    description:
      'Precise, efficient operations via API. You handle your own API key security — we never access your keys.',
  },
  {
    icon: TerminalSquare,
    title: 'Full System Access',
    description:
      'Read/write files, run shell commands, execute scripts. Your AI has real capabilities.',
  },
  {
    icon: Puzzle,
    title: 'Skills & Plugins',
    description:
      'Extend with community skills or build your own. Unlimited customization potential.',
  },
]

const included = [
  {
    icon: Server,
    title: 'Dedicated Ubuntu Server 25.10',
    description: '8 vCPUs, 16GB RAM, 128GB SSD',
  },
  {
    icon: Wrench,
    title: 'Fully Managed OpenClaw Instance',
    description: 'We handle all configuration and deployment',
  },
  {
    icon: RefreshCw,
    title: 'Automatic Updates & Maintenance',
    description: 'Always running the latest stable version',
  },
  {
    icon: Headphones,
    title: '24/7 Customer Support',
    description: 'Get help whenever you need it',
  },
  {
    icon: Users,
    title: 'Setup & Onboarding Assistance',
    description: 'We help you get started and connected',
  },
  {
    icon: MessageCircle,
    title: 'Integration Help',
    description: 'WhatsApp, Telegram, Discord, Slack, and more',
  },
]

const integrations = [
  'WhatsApp',
  'Telegram',
  'Discord',
  'Slack',
  'Signal',
  'iMessage',
  'Claude',
  'GPT',
  'Spotify',
  'Obsidian',
  'Twitter',
  'Browser',
  'Gmail',
  'GitHub',
  'Google Calendar',
  'Notion',
]

const faqs = [
  {
    question: 'What is OpenClaw?',
    answer:
      'OpenClaw is a personal AI assistant that runs on a dedicated server and integrates with your favorite chat apps. It can read/write files, run commands, use APIs, and remember your context across conversations.',
  },
  {
    question: 'What does the hosted service include?',
    answer:
      'You get a fully managed OpenClaw instance on a dedicated Ubuntu 25.10 server (8 vCPUs, 16GB RAM, 128GB SSD), plus automatic updates, 24/7 customer support, onboarding help, and integration assistance.',
  },
  {
    question: 'Can I use my own AI models?',
    answer:
      'Yes. OpenClaw supports Anthropic (Claude), OpenAI (GPT), and local models. You can configure which model to use for different tasks.',
  },
  {
    question: 'Is there a student discount?',
    answer:
      'The OpenClaw hosted service does not include a student discount. However, active event promotions are honored and will be reflected in the pricing above.',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Yes. Cancel anytime and keep access through the end of your billing period. No contracts, no cancellation fees.',
  },
  {
    question: 'How do I get started?',
    answer:
      "Click \"Get Started\" and we'll walk you through account setup, server provisioning, and connecting your chat apps. Most users are up and running within 30 minutes.",
  },
]

interface OpenClawContentProps {
  eventDiscount: { name: string; percentage: number } | null
}

export function OpenClawContent({ eventDiscount }: OpenClawContentProps) {
  const [isAnnual, setIsAnnual] = useState(false)
  const router = useRouter()
  const addItem = useCartStore((s) => s.addItem)

  const handleGetStarted = () => {
    const billingPeriod = isAnnual ? 'annual' : 'monthly'
    const price = isAnnual ? displayAnnualTotal : displayMonthly
    addItem({
      productId: `service-openclaw-${billingPeriod}`,
      name: `OpenClaw Service (${isAnnual ? 'Annual' : 'Monthly'})`,
      price,
      type: 'subscription',
      billingPeriod,
    })
    router.push('/checkout')
  }

  const eventPct = eventDiscount?.percentage ?? 0
  const hasEventDiscount = eventPct > 0

  const annualTotal = MONTHLY_PRICE * 12 * (1 - ANNUAL_DISCOUNT)

  const displayMonthly = calculateFinalPrice(MONTHLY_PRICE, null, eventPct || null)
  const displayAnnualTotal = calculateFinalPrice(annualTotal, null, eventPct || null)
  const displayMonthlyEquiv = Math.round((displayAnnualTotal / 12) * 100) / 100

  const currentPrice = isAnnual ? displayAnnualTotal : displayMonthly
  const originalPrice = isAnnual ? annualTotal : MONTHLY_PRICE

  return (
    <div className="bg-slate-950">
      {/* Hero Section */}
      <section className="relative py-24 sm:py-32 bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-3xl" />

        <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-sm px-4 py-1.5">
              Hosted AI Assistant
            </Badge>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white">
              OpenClaw
              <span className="block text-red-400 mt-2">Service</span>
            </h1>
            <p className="text-xl sm:text-2xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              The AI that actually does things. Fully managed, running on a dedicated server, connected to all your chat apps.
            </p>

            <div className="flex flex-col items-center gap-4">
              <div className="flex items-baseline gap-2">
                {hasEventDiscount && (
                  <span className="text-2xl text-slate-500 line-through">
                    ${formatCurrency(MONTHLY_PRICE)}
                  </span>
                )}
                <span className="text-5xl sm:text-6xl font-bold text-white">
                  ${formatCurrency(displayMonthly)}
                </span>
                <span className="text-slate-400 text-xl">/month</span>
              </div>
              {hasEventDiscount && eventDiscount && (
                <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                  {eventDiscount.name} — {formatDiscountPercentage(eventPct)} OFF
                </Badge>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="bg-red-500 hover:bg-red-600 text-white font-semibold text-lg px-8 py-6"
              >
                Get Started <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-2 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent text-lg px-8 py-6"
              >
                <a href="https://openclaw.ai" target="_blank" rel="noopener noreferrer">
                  Learn More About OpenClaw
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What is OpenClaw */}
      <section className="py-24 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                <span className="text-red-400">&gt;</span> What is OpenClaw?
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                A personal AI assistant with real capabilities. Not just a chatbot — an agent that takes action.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <div
                    key={feature.title}
                    className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-red-500/30 transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4 group-hover:bg-red-500/20 transition-colors">
                      <Icon className="w-6 h-6 text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-24 bg-slate-900">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                <span className="text-red-400">&gt;</span> What&#39;s Included
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Everything you need for a fully managed AI assistant experience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {included.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-4 p-5 rounded-xl bg-slate-800/30 border border-slate-700/30"
                  >
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{item.title}</h3>
                      <p className="text-slate-400 text-sm">{item.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                <span className="text-red-400">&gt;</span> Pricing
              </h2>
              <p className="text-lg text-slate-400">
                Simple, transparent pricing. No hidden fees.
              </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center bg-slate-800 rounded-2xl p-1.5 border border-slate-700">
                <button
                  onClick={() => setIsAnnual(false)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all text-sm ${
                    !isAnnual
                      ? 'bg-red-500 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setIsAnnual(true)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all text-sm ${
                    isAnnual
                      ? 'bg-red-500 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Annual
                  <span className="ml-2 text-xs text-green-400 font-semibold">
                    (Save 10%)
                  </span>
                </button>
              </div>
            </div>

            {/* Pricing Card */}
            <div className="rounded-2xl bg-slate-800/50 border-2 border-red-500/30 p-8 sm:p-10">
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-bold text-white">OpenClaw Hosted</h3>
                <p className="text-slate-400 text-sm">
                  Fully managed AI assistant on your dedicated server
                </p>

                <div className="py-6 space-y-2">
                  {hasEventDiscount && (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xl text-slate-500 line-through">
                        ${formatCurrency(originalPrice)}
                      </span>
                      <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
                        {formatDiscountPercentage(eventPct)} OFF
                      </Badge>
                    </div>
                  )}
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-white">
                      ${formatCurrency(currentPrice)}
                    </span>
                    <span className="text-slate-400">
                      / {isAnnual ? 'year' : 'month'}
                    </span>
                  </div>
                  {isAnnual && (
                    <p className="text-sm text-slate-500">
                      Equivalent to ${formatCurrency(displayMonthlyEquiv)}/mo
                    </p>
                  )}
                </div>

                <ul className="space-y-3 text-left max-w-sm mx-auto">
                  {[
                    'Dedicated Ubuntu 25.10 server',
                    '8 vCPUs, 16GB RAM, 128GB SSD',
                    'All chat app integrations',
                    '24/7 customer support',
                    'Automatic updates & maintenance',
                    'Setup & onboarding assistance',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-6">
                  <Button
                    onClick={handleGetStarted}
                    size="lg"
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold text-lg py-6"
                  >
                    Get Started <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Works With Everything */}
      <section className="py-24 bg-slate-900">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                <span className="text-red-400">&gt;</span> Works With Everything
              </h2>
              <p className="text-lg text-slate-400">
                50+ integrations and growing. Connect OpenClaw to the tools you already use.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {integrations.map((name) => (
                <span
                  key={name}
                  className="px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700/50 text-slate-300 text-sm font-medium hover:border-red-500/40 hover:text-white transition-colors"
                >
                  {name}
                </span>
              ))}
              <span className="px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium">
                + 30 more
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                <span className="text-red-400">&gt;</span> Questions?
              </h2>
              <p className="text-lg text-slate-400">
                Common questions about the OpenClaw hosted service.
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq) => (
                <div
                  key={faq.question}
                  className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/30"
                >
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-slate-400 mb-4">Still have questions?</p>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-2 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent"
              >
                <Link href="/contact">Talk to Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-red-950 via-slate-900 to-slate-950">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-4xl sm:text-5xl font-bold text-white">
              Ready to deploy your AI assistant?
            </h2>
            <p className="text-xl text-slate-300">
              Get a fully managed OpenClaw instance running on dedicated hardware. Set up in under 30 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="bg-red-500 hover:bg-red-600 text-white font-semibold text-lg px-8 py-6"
              >
                Get Started <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-2 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent text-lg px-8 py-6"
              >
                <a href="https://openclaw.ai" target="_blank" rel="noopener noreferrer">
                  Visit OpenClaw.ai
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
