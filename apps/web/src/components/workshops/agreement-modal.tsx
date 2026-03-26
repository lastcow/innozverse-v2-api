'use client'

import { useRef, useState, useEffect } from 'react'
import { X, ScrollText, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AgreementBody, AGREEMENT_VERSION } from './agreement-content'

interface AgreementModalProps {
  onAccept: (mediaConsent: boolean) => void
  onCancel: () => void
}

export function AgreementModal({ onAccept, onCancel }: AgreementModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hasScrolled, setHasScrolled] = useState(false)
  const [checked, setChecked] = useState(false)
  const [mediaConsent, setMediaConsent] = useState(true)

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

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <ScrollText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Workshop Registration Agreement</h2>
              <p className="text-xs text-blue-200">Maryland — Allegany County Programs · <span className="font-mono">{AGREEMENT_VERSION}</span></p>
            </div>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scroll hint */}
        {!hasScrolled && (
          <div className="px-6 pt-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <span className="text-base">📜</span>
              <span>Please <strong>scroll to the bottom</strong> to read the full agreement before accepting.</span>
            </div>
          </div>
        )}

        {/* Scrollable agreement body */}
        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-6 py-4">
          {/* Photo/video toggle inside the scroll area (replaces static media section) */}
          <AgreementBody mediaConsent={mediaConsent} readOnly={false} />

          {/* Media toggle — positioned after the shared content */}
          <div className={`mt-4 rounded-xl border-2 px-4 py-3 space-y-2 transition-colors ${mediaConsent ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-800 text-xs uppercase tracking-wide">📷 Your Photo & Video Preference</p>
              <button
                type="button"
                onClick={() => setMediaConsent(v => !v)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${mediaConsent ? 'bg-green-500' : 'bg-gray-300'}`}
                role="switch"
                aria-checked={mediaConsent}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition duration-200 ${mediaConsent ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              {mediaConsent
                ? <span>✅ <strong>Consent granted</strong> — photos/videos may be used for educational and promotional purposes.</span>
                : <span>🚫 <strong>Opted out</strong> — photos/videos will <strong>not</strong> be used for promotional purposes.</span>
              }
            </p>
            <p className="text-slate-400 text-[10px]">Toggle to opt out. You can change this at any time by contacting us in writing.</p>
          </div>

          <div className="h-2" />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 space-y-4 shrink-0 bg-gray-50 rounded-b-2xl">
          <label className={`flex items-start gap-3 cursor-pointer group ${!hasScrolled ? 'opacity-40 cursor-not-allowed' : ''}`}>
            <div className="relative mt-0.5 shrink-0">
              <input type="checkbox" disabled={!hasScrolled} checked={checked} onChange={(e) => setChecked(e.target.checked)} className="sr-only" />
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${checked ? 'bg-blue-600 border-blue-600 shadow-sm shadow-blue-300' : 'border-gray-300 bg-white'} ${hasScrolled && !checked ? 'group-hover:border-blue-400' : ''}`}>
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
            <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
            <Button className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-semibold" disabled={!checked || !hasScrolled} onClick={() => onAccept(mediaConsent)}>
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
