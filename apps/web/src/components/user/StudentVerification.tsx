'use client'

import { useEffect, useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  Clock,
  GraduationCap,
  Mail,
  XCircle,
  Percent,
  Zap,
  ShieldCheck,
  ArrowRight,
  Inbox,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import {
  getStudentVerificationStatus,
  requestStudentVerification,
} from '@/app/actions/student'

interface VerificationData {
  id: string
  status: string
  eduEmail: string | null
  verifiedAt: string | null
  createdAt: string
  adminNotes: string | null
}

// ─── Benefit pill used in NOT_SUBMITTED hero ─────────────────────────────────
function BenefitPill({
  icon: Icon,
  label,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  color?: string
}) {
  return (
    <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-sm ${color || 'bg-white/20 border-white/30 text-white'}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {label}
    </div>
  )
}

// ─── Step row used in PENDING state ──────────────────────────────────────────
function PendingStep({
  number,
  label,
  sublabel,
  done,
}: {
  number: number
  label: string
  sublabel: string
  done: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition-colors ${
          done
            ? 'bg-blue-600 text-white'
            : 'bg-white border-2 border-slate-200 text-slate-400'
        }`}
      >
        {done ? <CheckCircle2 className="w-4 h-4" /> : number}
      </div>
      <div>
        <p className={`text-sm font-medium ${done ? 'text-slate-900' : 'text-slate-500'}`}>
          {label}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>
      </div>
    </div>
  )
}

export function StudentVerification() {
  const [status, setStatus] = useState<string>('NOT_SUBMITTED')
  const [verification, setVerification] = useState<VerificationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [eduEmail, setEduEmail] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    loadStatus()
  }, [])

  async function loadStatus() {
    setLoading(true)
    try {
      const result = await getStudentVerificationStatus()
      setStatus(result.status)
      setVerification(result.verification)
    } catch {
      setError('Failed to load verification status')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!eduEmail.trim().toLowerCase().endsWith('.edu')) {
      setError('Please enter a valid .edu email address.')
      return
    }

    startTransition(async () => {
      const result = await requestStudentVerification(eduEmail.trim())
      if (result.error) {
        setError(result.error)
      } else {
        setEduEmail('')
        await loadStatus()
      }
    })
  }

  function handleResend() {
    if (!verification?.eduEmail) return
    setError('')

    startTransition(async () => {
      const result = await requestStudentVerification(verification.eduEmail!)
      if (result.error) {
        setError(result.error)
      } else {
        await loadStatus()
      }
    })
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Card className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="h-2 bg-gradient-to-r from-blue-600 to-blue-400" />
        <CardContent className="py-12 flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent" />
          </div>
          <p className="text-sm text-slate-500">Loading verification status…</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* ── Gradient banner header ───────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-500 px-6 pt-6 pb-5 overflow-hidden">
        {/* Subtle decorative ring */}
        <div className="pointer-events-none absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -right-2 top-6 w-20 h-20 rounded-full bg-white/5" />

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 border border-white/30">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white leading-tight">
              Student Verification
            </h3>
            <p className="text-xs text-blue-100 mt-0.5">
              Unlock exclusive student pricing
            </p>
          </div>

          {/* Status badge — top-right */}
          {status === 'APPROVED' && (
            <Badge className="ml-auto bg-white/20 text-white border border-white/30 text-xs font-semibold px-2.5">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
          {status === 'PENDING' && (
            <Badge className="ml-auto bg-white/20 text-white border border-white/30 text-xs font-semibold px-2.5">
              <Clock className="w-3 h-3 mr-1" />
              Pending
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-6">
        {/* ── Inline error (all states) ──────────────────────────────────────── */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 mb-5">
            <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-px" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            APPROVED — celebratory verified state
        ══════════════════════════════════════════════════════════════════════ */}
        {status === 'APPROVED' && verification && (
          <div className="space-y-4">
            {/* Hero checkmark */}
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-200">
                  <CheckCircle2 className="w-9 h-9 text-white" />
                </div>
                {/* Sparkle decoration */}
                <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-amber-400" />
              </div>
              <div className="text-center">
                <h4 className="text-base font-semibold text-slate-900">
                  Student Status Verified
                </h4>
                {verification.verifiedAt && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verified on{' '}
                    {new Date(verification.verifiedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </div>

            {/* Verified email pill */}
            {verification.eduEmail && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-400 leading-none mb-0.5">Verified with</p>
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {verification.eduEmail}
                  </p>
                </div>
                <ShieldCheck className="w-4 h-4 text-green-500 ml-auto shrink-0" />
              </div>
            )}

            {/* Benefits unlocked */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Benefits Unlocked
              </p>
              <ul className="space-y-2">
                {[
                  { icon: Percent, text: 'Up to 40% off premium hardware' },
                  { icon: Zap, text: 'Priority access to limited drops' },
                  { icon: ShieldCheck, text: 'Exclusive student bundles' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-2.5 text-sm text-slate-700">
                    <div className="w-5 h-5 rounded-md bg-green-100 flex items-center justify-center shrink-0">
                      <Icon className="w-3 h-3 text-green-600" />
                    </div>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            PENDING — awaiting email click, clear visual flow
        ══════════════════════════════════════════════════════════════════════ */}
        {status === 'PENDING' && verification && (
          <div className="space-y-5">
            {/* Mail illustration area */}
            <div className="flex flex-col items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 py-6 px-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
                  <Inbox className="w-7 h-7 text-white" />
                </div>
                {/* Animated ping dot */}
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400" />
                </span>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-800">Check your inbox</p>
                <p className="text-xs text-slate-500 mt-0.5 max-w-[220px] leading-relaxed">
                  We sent a link to{' '}
                  <span className="font-medium text-blue-700">{verification.eduEmail}</span>
                </p>
              </div>
            </div>

            {/* Step progress */}
            <div className="rounded-xl border border-slate-100 bg-white p-4 space-y-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Next steps
              </p>
              <div className="space-y-4">
                <PendingStep
                  number={1}
                  label="Verification email sent"
                  sublabel="Delivered to your .edu inbox"
                  done={true}
                />
                <div className="ml-3.5 h-4 border-l-2 border-dashed border-slate-200" />
                <PendingStep
                  number={2}
                  label="Open the email"
                  sublabel="Check spam if you don't see it"
                  done={false}
                />
                <div className="ml-3.5 h-4 border-l-2 border-dashed border-slate-200" />
                <PendingStep
                  number={3}
                  label="Click the verification link"
                  sublabel="Link expires in 24 hours"
                  done={false}
                />
              </div>
            </div>

            {/* Subtle resend row */}
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-slate-400">Didn&apos;t receive it?</p>
              <button
                type="button"
                onClick={handleResend}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3 h-3 ${isPending ? 'animate-spin' : ''}`} />
                {isPending ? 'Sending…' : 'Resend verification email'}
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            NOT_SUBMITTED + REJECTED — verification form
        ══════════════════════════════════════════════════════════════════════ */}
        {(status === 'NOT_SUBMITTED' || status === 'REJECTED') && (
          <div className="space-y-5">
            {/* REJECTED banner */}
            {status === 'REJECTED' && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                    <XCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-800">
                      Previous request rejected
                    </p>
                    {verification?.adminNotes && (
                      <p className="text-xs text-red-700 mt-1 leading-relaxed">
                        {verification.adminNotes}
                      </p>
                    )}
                    <p className="text-xs text-red-600 mt-1.5 font-medium">
                      You may resubmit with a valid .edu email address.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Benefit pills — only for NOT_SUBMITTED */}
            {status === 'NOT_SUBMITTED' && (
              <div className="-mt-6 -mx-6 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 flex flex-wrap gap-2">
                <BenefitPill icon={Percent} label="Up to 40% off" color="bg-amber-400/20 border-amber-300/40 text-amber-50" />
                <BenefitPill icon={Zap} label="Priority access" color="bg-emerald-400/20 border-emerald-300/40 text-emerald-50" />
                <BenefitPill icon={ShieldCheck} label="Exclusive bundles" color="bg-purple-400/20 border-purple-300/40 text-purple-50" />
              </div>
            )}

            {/* Intro text */}
            <p className="text-sm text-slate-600 leading-relaxed">
              Verify your student status to unlock exclusive discounts and
              benefits. Enter your institutional email and we&apos;ll send a
              secure verification link.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="edu-email"
                  className="text-sm font-medium text-slate-700"
                >
                  Student Email Address
                </Label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <Mail className="w-4 h-4 text-slate-400" />
                  </div>
                  <Input
                    id="edu-email"
                    type="email"
                    placeholder="you@university.edu"
                    value={eduEmail}
                    onChange={(e) => setEduEmail(e.target.value)}
                    required
                    className="rounded-xl pl-10 border-slate-200 bg-slate-50 placeholder:text-slate-400 focus-visible:ring-blue-500 focus-visible:border-blue-400 transition-colors"
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Must end in <span className="font-medium text-slate-600">.edu</span>
                </p>
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-medium transition-colors group"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                    Sending…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Verify Student Status
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                )}
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
