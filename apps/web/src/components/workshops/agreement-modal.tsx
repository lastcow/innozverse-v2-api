'use client'

import { useRef, useState, useEffect } from 'react'
import { X, ScrollText, CheckCircle2 } from 'lucide-react'
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
    // Consider "scrolled" when within 40px of the bottom
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      setHasScrolled(true)
    }
  }

  // Prevent body scroll while modal open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Workshop Registration Agreement
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scroll hint */}
        {!hasScrolled && (
          <div className="px-6 pt-3 shrink-0">
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
              📜 Please scroll to the bottom to read the full agreement before accepting.
            </p>
          </div>
        )}

        {/* Scrollable agreement body */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-4 text-sm text-slate-700 space-y-5 leading-relaxed"
        >
          <p className="text-xs text-slate-400 italic">
            STEM Workshop Registration Agreement & Liability Waiver (Maryland) — Applicable to Allegany County, Maryland Programs
          </p>
          <p>
            By registering, you (&ldquo;Parent/Guardian&rdquo;) agree to the following on behalf of yourself and your child (&ldquo;Participant&rdquo;):
          </p>

          <Section title="Registration and Eligibility">
            <p>You confirm that:</p>
            <ul>
              <li>You are the legal parent or guardian of the Participant</li>
              <li>All registration information is accurate</li>
              <li>The Participant meets program requirements</li>
            </ul>
          </Section>

          <Section title="Assumption of Risk">
            <p>
              You acknowledge that participation in STEM activities (including experiments, tools, equipment, and group interaction) involves inherent risks, including but not limited to minor injuries, cuts, burns, or property damage.
            </p>
            <p>You knowingly and voluntarily assume all such risks on behalf of the Participant.</p>
          </Section>

          <Section title="Maryland Liability Waiver and Release (Enhanced)">
            <p>To the fullest extent permitted under Maryland law:</p>
            <p>
              You, on behalf of yourself and the Participant, waive, release, and discharge <strong>Innozverse</strong>, its owners, officers, employees, instructors, volunteers, agents, partnering schools, and affiliates (&ldquo;Released Parties&rdquo;) from any and all claims, demands, actions, or causes of action arising out of or related to participation in the program, including those caused by ordinary negligence.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-xs">
              <strong>Important Notice (Maryland Law):</strong> This waiver does not apply to claims resulting from gross negligence, reckless conduct, or intentional misconduct, which cannot be waived under Maryland law.
            </div>
          </Section>

          <Section title="Indemnification Clause">
            <p>
              You agree to defend, indemnify, and hold harmless the Released Parties from and against any claims, damages, liabilities, costs, or expenses (including attorney&rsquo;s fees) arising from:
            </p>
            <ul>
              <li>The Participant&rsquo;s actions or behavior</li>
              <li>Any breach of this Agreement</li>
              <li>Any claims brought by or on behalf of the Participant</li>
            </ul>
          </Section>

          <Section title="Medical Authorization">
            <p>You authorize the program staff to seek emergency medical care if needed.</p>
            <p>You acknowledge that:</p>
            <ul>
              <li>You are financially responsible for any medical treatment</li>
              <li>You have disclosed all relevant medical conditions, allergies, or special needs</li>
            </ul>
          </Section>

          <Section title="Code of Conduct and Dismissal Policy">
            <p>Participants must follow all safety rules and instructions. The program reserves the right to:</p>
            <ul>
              <li>Remove any participant for unsafe, disruptive, or inappropriate behavior</li>
              <li>Suspend participation immediately if safety is at risk</li>
            </ul>
            <p>No refund is guaranteed in cases of dismissal due to misconduct.</p>
          </Section>

          <Section title="Pickup Authorization & Release of Child">
            <p>You must provide authorized pickup individuals during registration. By registering, you agree:</p>
            <ul>
              <li>Only authorized individuals may pick up the Participant</li>
              <li>Valid identification may be required</li>
              <li>The program is not responsible for the Participant after authorized pickup</li>
            </ul>
            <p className="text-xs text-slate-500">
              For after-school programs: If held on school premises, dismissal may follow school procedures unless otherwise stated. The program is not responsible for transportation unless explicitly provided.
            </p>
          </Section>

          <Section title="School Partnership / After-School Program Terms">
            <p>If the workshop is conducted in partnership with a school:</p>
            <ul>
              <li>The program may operate on school property but is independently operated unless otherwise stated</li>
              <li>The school district, school, and their staff are included as Released Parties under this Agreement</li>
              <li>You acknowledge that participation is voluntary and not part of the required school curriculum</li>
            </ul>
          </Section>

          <Section title="Cancellation and Refund Policy">
            <p>
              Cancellations must be submitted in writing. Refunds (if any) will follow the official posted policy. Programs may be canceled or rescheduled due to weather, low enrollment, or unforeseen events.
            </p>
          </Section>

          <Section title="Media Release">
            <p>
              Unless you opt out in writing, you grant permission for use of photos/videos for educational and promotional purposes without compensation.
            </p>
          </Section>

          <Section title="Privacy">
            <p>
              Information collected is used only for program administration and handled in accordance with applicable laws.
            </p>
          </Section>

          <Section title="Governing Law and Venue">
            <p>
              This Agreement is governed by Maryland law. Any disputes shall be resolved in courts located in Allegany County, Maryland.
            </p>
          </Section>

          <Section title="Electronic Consent">
            <p>By selecting &ldquo;I Agree,&rdquo; you acknowledge that:</p>
            <ul>
              <li>You have read and understand this Agreement</li>
              <li>You agree voluntarily</li>
              <li>This is legally binding under Maryland law</li>
              <li>Electronic acceptance equals a signed document</li>
            </ul>
          </Section>

          {/* Spacer to ensure scroll reaches bottom */}
          <div className="h-2" />
        </div>

        {/* Footer — checkbox + buttons */}
        <div className="px-6 py-4 border-t border-gray-100 space-y-4 shrink-0">
          {/* Checkbox — only enabled after scrolling */}
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
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                  ${checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}
                  ${hasScrolled ? 'group-hover:border-blue-400' : ''}`}
              >
                {checked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </div>
            </div>
            <span className="text-sm text-slate-700 leading-relaxed">
              I am the parent/legal guardian. I have read and agree to the STEM Workshop Agreement, including the{' '}
              <strong>liability waiver</strong>, <strong>indemnification</strong>,{' '}
              <strong>medical authorization</strong>, and <strong>pickup policy</strong>.
            </span>
          </label>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              className="flex-2 flex-[2] bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!checked || !hasScrolled}
              onClick={onAccept}
            >
              I Agree — Continue Registration
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
      <div className="space-y-1.5 text-slate-600 pl-0">
        {children}
      </div>
    </div>
  )
}
