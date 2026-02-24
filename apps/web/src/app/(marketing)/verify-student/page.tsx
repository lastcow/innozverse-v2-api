import { prisma } from '@repo/database'
import { verifyVerificationToken } from '@/lib/verification-token'
import {
  CheckCircle2,
  XCircle,
  GraduationCap,
  Percent,
  Zap,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Mail,
} from 'lucide-react'
import Link from 'next/link'

export default async function VerifyStudentPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return (
      <ResultCard
        variant="error"
        errorKind="missing"
        title="Missing Token"
        message="No verification token was provided in the link."
      />
    )
  }

  const tokenData = verifyVerificationToken(token)

  if (!tokenData) {
    return (
      <ResultCard
        variant="error"
        errorKind="expired"
        title="Invalid or Expired Link"
        message="This verification link is invalid or has expired. Please request a new one from your profile."
        showRetry
      />
    )
  }

  // Look up the verification record
  const verification = await prisma.studentVerification.findUnique({
    where: { id: tokenData.id },
  })

  if (!verification) {
    return (
      <ResultCard
        variant="error"
        errorKind="missing"
        title="Not Found"
        message="This verification record could not be found."
      />
    )
  }

  // Already verified
  if (verification.status === 'APPROVED') {
    return (
      <ResultCard
        variant="success"
        title="Already Verified"
        message="Your student status has already been verified. You have access to student discounts and benefits."
        eduEmail={verification.eduEmail}
      />
    )
  }

  // Email mismatch — user changed email after this link was generated
  if (verification.eduEmail !== tokenData.email) {
    return (
      <ResultCard
        variant="error"
        errorKind="outdated"
        title="Outdated Link"
        message="Your verification email has been updated since this link was sent. Please use the most recent verification link from your inbox."
        showRetry
      />
    )
  }

  // Mark as verified (conditional update to handle concurrent clicks)
  const result = await prisma.studentVerification.updateMany({
    where: { id: verification.id, status: 'PENDING' },
    data: {
      status: 'APPROVED',
      verifiedAt: new Date(),
    },
  })

  if (result.count === 0) {
    return (
      <ResultCard
        variant="success"
        title="Already Verified"
        message="Your student status has already been verified. You have access to student discounts and benefits."
        eduEmail={verification.eduEmail}
      />
    )
  }

  return (
    <ResultCard
      variant="success"
      title="You're Verified!"
      message="Your student status has been confirmed. Student discounts and exclusive benefits are now active on your account."
      eduEmail={verification.eduEmail}
    />
  )
}

// ─── ResultCard component ─────────────────────────────────────────────────────

function ResultCard({
  variant,
  errorKind,
  title,
  message,
  eduEmail,
  showRetry,
}: {
  variant: 'success' | 'error'
  errorKind?: 'missing' | 'expired' | 'outdated'
  title: string
  message: string
  eduEmail?: string | null
  showRetry?: boolean
}) {
  const isSuccess = variant === 'success'

  // Choose the right error icon and accent color based on kind
  const errorIcon =
    errorKind === 'expired' ? (
      <RefreshCw className="w-8 h-8 text-white" />
    ) : errorKind === 'outdated' ? (
      <Mail className="w-8 h-8 text-white" />
    ) : (
      <AlertTriangle className="w-8 h-8 text-white" />
    )

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      {/* Subtle page-level background tint */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-blue-50/60 via-white to-slate-50"
      />

      <div className="max-w-md w-full">
        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">

          {/* ── Gradient header strip ────────────────────────────────────────── */}
          <div
            className={`relative px-6 pt-8 pb-10 overflow-hidden ${
              isSuccess
                ? 'bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400'
                : 'bg-gradient-to-br from-slate-600 via-slate-500 to-slate-400'
            }`}
          >
            {/* Decorative rings */}
            <div className="pointer-events-none absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -right-4 bottom-0 w-28 h-28 rounded-full bg-white/5" />

            {/* Brand badge */}
            <div className="relative flex items-center gap-1.5 mb-8">
              <div className="w-6 h-6 rounded-md bg-white/20 border border-white/30 flex items-center justify-center">
                <GraduationCap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold text-white/80 tracking-wide">
                innoZverse
              </span>
            </div>

            {/* Hero icon */}
            <div className="relative flex flex-col items-center gap-4">
              {isSuccess ? (
                <>
                  {/* Success: layered glow circles */}
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-white/20 scale-150 blur-lg" />
                    <div className="relative w-20 h-20 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center shadow-xl">
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  {/* Decorative dots — confetti-like */}
                  <div className="absolute top-0 left-8 w-2 h-2 rounded-full bg-amber-300/70" />
                  <div className="absolute top-4 right-10 w-1.5 h-1.5 rounded-full bg-white/50" />
                  <div className="absolute bottom-2 left-16 w-1 h-1 rounded-full bg-white/40" />
                  <div className="absolute top-8 right-6 w-2.5 h-2.5 rounded-full bg-emerald-300/60" />
                </>
              ) : (
                <div className="w-20 h-20 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center">
                  {errorIcon}
                </div>
              )}
            </div>
          </div>

          {/* ── Card body ──────────────────────────────────────────────────────── */}
          <div className="px-6 pt-6 pb-7 space-y-5">
            <div className="text-center space-y-1.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {title}
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
            </div>

            {/* Verified email pill */}
            {eduEmail && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-400 leading-none mb-0.5 uppercase tracking-wide">
                    Verified email
                  </p>
                  <p className="text-sm font-medium text-slate-800 truncate">{eduEmail}</p>
                </div>
                <ShieldCheck className="w-4 h-4 text-green-500 ml-auto shrink-0" />
              </div>
            )}

            {/* Benefits grid — success only */}
            {isSuccess && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  Benefits now active
                </p>
                <ul className="space-y-2.5">
                  {[
                    { icon: Percent, label: 'Up to 40% off premium hardware', color: 'bg-blue-100 text-blue-600' },
                    { icon: Zap,     label: 'Priority access to limited drops', color: 'bg-amber-100 text-amber-600' },
                    { icon: ShieldCheck, label: 'Exclusive student bundles', color: 'bg-green-100 text-green-600' },
                  ].map(({ icon: Icon, label, color }) => (
                    <li key={label} className="flex items-center gap-2.5 text-sm text-slate-700">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Error helper steps — errors only */}
            {!isSuccess && showRetry && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  What to do next
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  {errorKind === 'expired' && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        Go to your profile and request a new verification email
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        Links expire after 24 hours for security
                      </li>
                    </>
                  )}
                  {errorKind === 'outdated' && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        Check your inbox for a more recent verification email
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        Always use the latest link sent to your .edu address
                      </li>
                    </>
                  )}
                </ul>
              </div>
            )}

            {/* CTA button */}
            <Link
              href={showRetry ? '/user/settings/profile' : '/user/dashboard'}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 py-2.5 text-sm font-semibold transition-colors"
            >
              {showRetry ? 'Request a New Link' : 'Go to Dashboard'}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            {/* Secondary link */}
            <p className="text-center text-xs text-slate-400">
              {isSuccess ? (
                <>
                  Questions?{' '}
                  <Link
                    href="/contact"
                    className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Contact support
                  </Link>
                </>
              ) : (
                <>
                  Need help?{' '}
                  <Link
                    href="/contact"
                    className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Contact support
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Below-card innoZverse tagline */}
        <p className="text-center text-xs text-slate-400 mt-5 flex items-center justify-center gap-1.5">
          <GraduationCap className="w-3.5 h-3.5" />
          innoZverse Student Program
        </p>
      </div>
    </div>
  )
}
