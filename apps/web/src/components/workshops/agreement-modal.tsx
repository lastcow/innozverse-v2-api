'use client'

import { useRef, useState, useEffect } from 'react'
import { X, ScrollText, CheckCircle2, AlertTriangle, Shield, Heart, Camera, MapPin, Ban, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AgreementModalProps {
  onAccept: () => void
  onCancel: () => void
}

export function AgreementModal({ onAccept, onCancel }: AgreementModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hasScrolled, setHasScrolled] = useState(false)
  const [checked, setChecked] = useState(false)

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      setHasScrolled(true)
    }
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <ScrollText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Workshop Registration Agreement</h2>
              <p className="text-xs text-blue-200">Maryland — Allegany County Programs</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scroll hint ── */}
        {!hasScrolled && (
          <div className="px-6 pt-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <span className="text-base">📜</span>
              <span>Please <strong>scroll to the bottom</strong> to read the full agreement before accepting.</span>
            </div>
          </div>
        )}

        {/* ── Body ── */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-sm leading-relaxed"
        >

          <p className="text-slate-500 text-xs border-l-2 border-blue-200 pl-3 italic">
            By registering, you ("Parent/Guardian") agree to the following on behalf of yourself and your child ("Participant").
          </p>

          {/* Registration & Eligibility */}
          <Section icon={CheckCircle2} iconColor="text-green-500" bg="bg-green-50" border="border-green-200" title="Registration and Eligibility">
            <p className="text-slate-600">You confirm that:</p>
            <ul className="mt-1 space-y-1">
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> You are the legal parent or guardian of the Participant</li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> All registration information is accurate</li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> The Participant meets program requirements</li>
            </ul>
          </Section>

          {/* Assumption of Risk */}
          <Section icon={AlertTriangle} iconColor="text-orange-500" bg="bg-orange-50" border="border-orange-200" title="Assumption of Risk">
            <p className="text-slate-600">
              You acknowledge that participation in STEM activities (including experiments, tools, equipment, and group interaction) involves inherent risks, including but not limited to <strong>minor injuries, cuts, burns, or property damage</strong>.
            </p>
            <p className="mt-1.5 font-medium text-orange-700">You knowingly and voluntarily assume all such risks on behalf of the Participant.</p>
          </Section>

          {/* Liability Waiver */}
          <Section icon={Shield} iconColor="text-red-500" bg="bg-red-50" border="border-red-200" title="Maryland Liability Waiver and Release">
            <p className="text-slate-600">To the fullest extent permitted under Maryland law, you waive, release, and discharge <strong>Innozverse</strong>, its owners, officers, employees, instructors, volunteers, agents, partnering schools, and affiliates (&ldquo;Released Parties&rdquo;) from <strong>any and all claims</strong> arising from participation in the program, including those caused by ordinary negligence.</p>
            <div className="mt-3 flex items-start gap-2 bg-red-100 border border-red-300 rounded-lg p-3 text-xs text-red-800">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span><strong>Important (Maryland Law):</strong> This waiver does <em>not</em> apply to claims resulting from <strong>gross negligence, reckless conduct, or intentional misconduct</strong>, which cannot be waived under Maryland law.</span>
            </div>
          </Section>

          {/* Indemnification */}
          <Section icon={Scale} iconColor="text-purple-500" bg="bg-purple-50" border="border-purple-200" title="Indemnification">
            <p className="text-slate-600">You agree to defend, indemnify, and hold harmless the Released Parties from any claims, damages, or expenses (including attorney&rsquo;s fees) arising from:</p>
            <ul className="mt-1 space-y-1 text-slate-600">
              <li className="flex items-start gap-2"><span className="text-purple-500 mt-0.5">•</span> The Participant&rsquo;s actions or behavior</li>
              <li className="flex items-start gap-2"><span className="text-purple-500 mt-0.5">•</span> Any breach of this Agreement</li>
              <li className="flex items-start gap-2"><span className="text-purple-500 mt-0.5">•</span> Any claims brought by or on behalf of the Participant</li>
            </ul>
          </Section>

          {/* Medical Authorization */}
          <Section icon={Heart} iconColor="text-pink-500" bg="bg-pink-50" border="border-pink-200" title="Medical Authorization">
            <p className="text-slate-600">You authorize program staff to seek <strong>emergency medical care</strong> if needed. You acknowledge that:</p>
            <ul className="mt-1 space-y-1 text-slate-600">
              <li className="flex items-start gap-2"><span className="text-pink-500 mt-0.5">•</span> You are <strong>financially responsible</strong> for any medical treatment</li>
              <li className="flex items-start gap-2"><span className="text-pink-500 mt-0.5">•</span> You have disclosed all relevant <strong>medical conditions, allergies, or special needs</strong></li>
            </ul>
          </Section>

          {/* Code of Conduct */}
          <Section icon={Ban} iconColor="text-slate-500" bg="bg-slate-50" border="border-slate-200" title="Code of Conduct & Dismissal Policy">
            <p className="text-slate-600">Participants must follow all safety rules and instructions. The program reserves the right to:</p>
            <ul className="mt-1 space-y-1 text-slate-600">
              <li className="flex items-start gap-2"><span className="text-slate-400 mt-0.5">•</span> Remove any participant for <strong>unsafe, disruptive, or inappropriate behavior</strong></li>
              <li className="flex items-start gap-2"><span className="text-slate-400 mt-0.5">•</span> <strong>Suspend participation immediately</strong> if safety is at risk</li>
            </ul>
            <p className="mt-2 text-xs text-slate-500 font-semibold">⚠️ No refund is guaranteed in cases of dismissal due to misconduct.</p>
          </Section>

          {/* Pickup */}
          <Section icon={MapPin} iconColor="text-blue-500" bg="bg-blue-50" border="border-blue-200" title="Pickup Authorization & Release of Child">
            <p className="text-slate-600">You must provide authorized pickup individuals during registration. By registering:</p>
            <ul className="mt-1 space-y-1 text-slate-600">
              <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> <strong>Only authorized individuals</strong> may pick up the Participant</li>
              <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> <strong>Valid identification may be required</strong></li>
              <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> The program is <strong>not responsible</strong> for the Participant after authorized pickup</li>
            </ul>
          </Section>

          {/* School Partnership */}
          <Section icon={Shield} iconColor="text-indigo-500" bg="bg-indigo-50" border="border-indigo-200" title="School Partnership / After-School Program">
            <p className="text-slate-600">If the workshop is conducted in partnership with a school:</p>
            <ul className="mt-1 space-y-1 text-slate-600">
              <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">•</span> The program operates independently unless otherwise stated</li>
              <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">•</span> The school and its staff are included as Released Parties</li>
              <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">•</span> Participation is voluntary and not part of required curriculum</li>
            </ul>
          </Section>

          {/* Cancellation */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 space-y-1">
            <p className="font-semibold text-slate-800 text-xs uppercase tracking-wide">Cancellation & Refund Policy</p>
            <p className="text-slate-600 text-xs">Cancellations must be submitted <strong>in writing</strong>. Refunds (if any) follow the official posted policy. Programs may be <strong>canceled or rescheduled</strong> due to weather, low enrollment, or unforeseen events.</p>
          </div>

          {/* Media */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 space-y-1">
            <div className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-gray-500" />
              <p className="font-semibold text-slate-800 text-xs uppercase tracking-wide">Media Release</p>
            </div>
            <p className="text-slate-600 text-xs">Unless you <strong>opt out in writing</strong>, you grant permission for use of photos/videos for educational and promotional purposes <strong>without compensation</strong>.</p>
          </div>

          {/* Privacy & Governing Law */}
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

          {/* Electronic Consent highlight */}
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

          <div className="h-2" />
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-gray-100 space-y-4 shrink-0 bg-gray-50 rounded-b-2xl">
          <label className={`flex items-start gap-3 cursor-pointer group ${!hasScrolled ? 'opacity-40 cursor-not-allowed' : ''}`}>
            <div className="relative mt-0.5 shrink-0">
              <input
                type="checkbox"
                disabled={!hasScrolled}
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                  ${checked ? 'bg-blue-600 border-blue-600 shadow-sm shadow-blue-300' : 'border-gray-300 bg-white'}
                  ${hasScrolled && !checked ? 'group-hover:border-blue-400' : ''}`}
              >
                {checked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </div>
            </div>
            <span className="text-sm text-slate-700 leading-relaxed">
              I am the parent/legal guardian. I have read and agree to the{' '}
              <strong className="text-slate-900">STEM Workshop Agreement</strong>, including the{' '}
              <span className="text-red-600 font-semibold">liability waiver</span>,{' '}
              <span className="text-purple-600 font-semibold">indemnification</span>,{' '}
              <span className="text-pink-600 font-semibold">medical authorization</span>, and{' '}
              <span className="text-blue-600 font-semibold">pickup policy</span>.
            </span>
          </label>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              disabled={!checked || !hasScrolled}
              onClick={onAccept}
            >
              ✓ I Agree — Continue Registration
            </Button>
          </div>

          <p className="text-[10px] text-slate-400 text-center">
            Your acceptance is timestamped and recorded per Maryland electronic signature law.
          </p>
        </div>
      </div>
    </div>
  )
}

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
