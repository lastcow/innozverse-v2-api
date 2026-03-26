/**
 * Shared STEM Workshop Agreement content.
 * Used by:
 *  - AgreementModal (user registration flow) — interactive scroll + checkbox
 *  - AgreementViewDialog (admin view) — read-only, pre-accepted state
 */

import { AlertTriangle, Shield, CheckCircle2, Heart, Ban, MapPin, Scale, Camera } from 'lucide-react'

export const AGREEMENT_VERSION = 'MD-STEM-v1-2026-03-26'

function Section({
  icon: Icon,
  iconColor,
  bg,
  border,
  title,
  children,
}: {
  icon: React.ElementType
  iconColor: string
  bg: string
  border: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className={`rounded-xl border ${border} ${bg} px-4 py-3 space-y-2`}>
      <div className={`flex items-center gap-2 font-semibold text-slate-800 text-sm`}>
        <Icon className={`w-4 h-4 ${iconColor} shrink-0`} />
        {title}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  )
}

interface AgreementBodyProps {
  /** When true, renders Media Release section with a live toggle. When false, shows static accepted/denied state. */
  mediaConsent?: boolean
  /** Admin read-only view: show as already-accepted (all sections confirmed) */
  readOnly?: boolean
}

export function AgreementBody({ mediaConsent = true, readOnly = false }: AgreementBodyProps) {
  return (
    <div className="space-y-4 text-sm leading-relaxed">
      <p className="text-xs text-slate-400 italic border-l-2 border-blue-200 pl-3">
        STEM Workshop Registration Agreement & Liability Waiver (Maryland) — Applicable to Allegany County, Maryland Programs
      </p>
      <p className="text-slate-500 text-xs border-l-2 border-blue-200 pl-3 italic">
        By registering, you (&ldquo;Parent/Guardian&rdquo;) agree to the following on behalf of yourself and your child (&ldquo;Participant&rdquo;).
      </p>

      <Section icon={CheckCircle2} iconColor="text-green-500" bg="bg-green-50" border="border-green-200" title="Registration and Eligibility">
        <p className="text-slate-600">You confirm that:</p>
        <ul className="mt-1 space-y-1">
          <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> You are the legal parent or guardian of the Participant</li>
          <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> All registration information is accurate</li>
          <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> The Participant meets program requirements</li>
        </ul>
      </Section>

      <Section icon={AlertTriangle} iconColor="text-orange-500" bg="bg-orange-50" border="border-orange-200" title="Assumption of Risk">
        <p className="text-slate-600">
          You acknowledge that participation in STEM activities (including experiments, tools, equipment, and group interaction) involves inherent risks, including but not limited to <strong>minor injuries, cuts, burns, or property damage</strong>.
        </p>
        <p className="mt-1.5 font-medium text-orange-700">You knowingly and voluntarily assume all such risks on behalf of the Participant.</p>
      </Section>

      <Section icon={Shield} iconColor="text-red-500" bg="bg-red-50" border="border-red-200" title="Maryland Liability Waiver and Release">
        <p className="text-slate-600">To the fullest extent permitted under Maryland law, you waive, release, and discharge <strong>Innozverse</strong>, its owners, officers, employees, instructors, volunteers, agents, partnering schools, and affiliates (&ldquo;Released Parties&rdquo;) from <strong>any and all claims</strong> arising from participation in the program, including those caused by ordinary negligence.</p>
        <div className="mt-3 flex items-start gap-2 bg-red-100 border border-red-300 rounded-lg p-3 text-xs text-red-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <span><strong>Important (Maryland Law):</strong> This waiver does <em>not</em> apply to claims resulting from <strong>gross negligence, reckless conduct, or intentional misconduct</strong>, which cannot be waived under Maryland law.</span>
        </div>
      </Section>

      <Section icon={Scale} iconColor="text-purple-500" bg="bg-purple-50" border="border-purple-200" title="Indemnification">
        <p className="text-slate-600">You agree to defend, indemnify, and hold harmless the Released Parties from any claims, damages, or expenses (including attorney&rsquo;s fees) arising from:</p>
        <ul className="mt-1 space-y-1 text-slate-600">
          <li className="flex items-start gap-2"><span className="text-purple-500 mt-0.5">•</span> The Participant&rsquo;s actions or behavior</li>
          <li className="flex items-start gap-2"><span className="text-purple-500 mt-0.5">•</span> Any breach of this Agreement</li>
          <li className="flex items-start gap-2"><span className="text-purple-500 mt-0.5">•</span> Any claims brought by or on behalf of the Participant</li>
        </ul>
      </Section>

      <Section icon={Heart} iconColor="text-pink-500" bg="bg-pink-50" border="border-pink-200" title="Medical Authorization">
        <p className="text-slate-600">You authorize program staff to seek <strong>emergency medical care</strong> if needed. You acknowledge that:</p>
        <ul className="mt-1 space-y-1 text-slate-600">
          <li className="flex items-start gap-2"><span className="text-pink-500 mt-0.5">•</span> You are <strong>financially responsible</strong> for any medical treatment</li>
          <li className="flex items-start gap-2"><span className="text-pink-500 mt-0.5">•</span> You have disclosed all relevant <strong>medical conditions, allergies, or special needs</strong></li>
        </ul>
      </Section>

      <Section icon={Ban} iconColor="text-slate-500" bg="bg-slate-50" border="border-slate-200" title="Code of Conduct & Dismissal Policy">
        <p className="text-slate-600">Participants must follow all safety rules and instructions. The program reserves the right to:</p>
        <ul className="mt-1 space-y-1 text-slate-600">
          <li className="flex items-start gap-2"><span className="text-slate-400 mt-0.5">•</span> Remove any participant for <strong>unsafe, disruptive, or inappropriate behavior</strong></li>
          <li className="flex items-start gap-2"><span className="text-slate-400 mt-0.5">•</span> <strong>Suspend participation immediately</strong> if safety is at risk</li>
        </ul>
        <p className="mt-2 text-xs text-slate-500 font-semibold">⚠️ No refund is guaranteed in cases of dismissal due to misconduct.</p>
      </Section>

      <Section icon={MapPin} iconColor="text-blue-500" bg="bg-blue-50" border="border-blue-200" title="Pickup Authorization & Release of Child">
        <p className="text-slate-600">You must provide authorized pickup individuals during registration. By registering:</p>
        <ul className="mt-1 space-y-1 text-slate-600">
          <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> <strong>Only authorized individuals</strong> may pick up the Participant</li>
          <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> <strong>Valid identification may be required</strong></li>
          <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> The program is <strong>not responsible</strong> for the Participant after authorized pickup</li>
        </ul>
      </Section>

      <Section icon={Shield} iconColor="text-indigo-500" bg="bg-indigo-50" border="border-indigo-200" title="School Partnership / After-School Program">
        <p className="text-slate-600">If the workshop is conducted in partnership with a school:</p>
        <ul className="mt-1 space-y-1 text-slate-600">
          <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">•</span> The program operates independently unless otherwise stated</li>
          <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">•</span> The school and its staff are included as Released Parties</li>
          <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">•</span> Participation is voluntary and not part of required curriculum</li>
        </ul>
      </Section>

      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 space-y-1">
        <p className="font-semibold text-slate-800 text-xs uppercase tracking-wide">Cancellation & Refund Policy</p>
        <p className="text-slate-600 text-xs">Cancellations must be submitted <strong>in writing</strong>. Refunds (if any) follow the official posted policy. Programs may be <strong>canceled or rescheduled</strong> due to weather, low enrollment, or unforeseen events.</p>
      </div>

      {/* Media Release — static in read-only, shows accepted state */}
      <div className={`rounded-xl border-2 px-4 py-3 space-y-2 transition-colors ${mediaConsent ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Camera className={`w-3.5 h-3.5 ${mediaConsent ? 'text-green-600' : 'text-gray-400'}`} />
            <p className="font-semibold text-slate-800 text-xs uppercase tracking-wide">Photo & Video Consent</p>
          </div>
          {readOnly && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${mediaConsent ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
              {mediaConsent ? '✓ Granted' : '✗ Denied'}
            </span>
          )}
        </div>
        <p className="text-slate-600 text-xs">
          {mediaConsent
            ? <span>✅ <strong>Consent granted</strong> — photos/videos of the Participant may be used for educational and promotional purposes without compensation.</span>
            : <span>🚫 <strong>Opted out</strong> — photos/videos of the Participant will <strong>not</strong> be used for promotional purposes.</span>
          }
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="font-semibold text-slate-800 text-xs uppercase tracking-wide mb-1">Privacy</p>
          <p className="text-slate-600 text-xs">Information collected is used only for program administration and handled per applicable laws.</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="font-semibold text-slate-800 text-xs uppercase tracking-wide mb-1">Governing Law</p>
          <p className="text-slate-600 text-xs">Governed by Maryland law. Disputes resolved in Allegany County, Maryland courts.</p>
        </div>
      </div>

      <div className="rounded-xl border-2 border-blue-300 bg-blue-50 px-4 py-3 space-y-1.5">
        <p className="font-bold text-blue-800 text-sm">Electronic Consent</p>
        <p className="text-blue-700 text-xs">By selecting &ldquo;I Agree,&rdquo; you confirm that:</p>
        <ul className="text-blue-700 text-xs space-y-0.5">
          <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 shrink-0" /> You have read and understand this Agreement</li>
          <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 shrink-0" /> You agree voluntarily</li>
          <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 shrink-0" /> This is legally binding under Maryland law</li>
          <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 shrink-0" /> Electronic acceptance equals a signed document</li>
        </ul>
      </div>
    </div>
  )
}
