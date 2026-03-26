'use client'

import { useEffect } from 'react'
import { X, ScrollText, ShieldCheck, ShieldX, Camera, CameraOff, Clock, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AgreementBody, AGREEMENT_VERSION } from './agreement-content'

interface AgreementViewDialogProps {
  version: string | null
  acceptedAt: string | null
  ip: string | null
  userAgent: string | null
  mediaConsent: boolean
  userName?: string
  onClose: () => void
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit',
    hour12: true, timeZoneName: 'short',
  })

export function AgreementViewDialog({
  version,
  acceptedAt,
  ip,
  userAgent,
  mediaConsent,
  userName,
  onClose,
}: AgreementViewDialogProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const hasAgreed = !!acceptedAt

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
              <h2 className="text-base font-bold text-white leading-tight">Agreement on Record</h2>
              {userName && <p className="text-xs text-blue-200">{userName}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Consent metadata banner */}
        <div className="px-6 pt-4 pb-2 shrink-0">
          <div className={`rounded-xl border-2 px-4 py-3 ${hasAgreed ? 'border-green-300 bg-green-50' : 'border-amber-300 bg-amber-50'}`}>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {/* Agreement status */}
              <div className="flex items-center gap-2">
                {hasAgreed
                  ? <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
                  : <ShieldX className="w-5 h-5 text-amber-600 shrink-0" />
                }
                <div>
                  <p className={`font-semibold text-xs ${hasAgreed ? 'text-green-800' : 'text-amber-800'}`}>
                    {hasAgreed ? 'Agreement Signed' : 'No Agreement on Record'}
                  </p>
                  {version && <p className="text-[10px] text-gray-500 font-mono">{version}</p>}
                </div>
              </div>

              {/* Signed at */}
              {acceptedAt && (
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>{formatDateTime(acceptedAt)}</span>
                </div>
              )}

              {/* IP */}
              {ip && (
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Globe className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-mono">{ip}</span>
                </div>
              )}

              {/* Media consent */}
              <div className="flex items-center gap-1.5 text-xs">
                {mediaConsent
                  ? <Camera className="w-3.5 h-3.5 text-blue-500" />
                  : <CameraOff className="w-3.5 h-3.5 text-orange-500" />
                }
                <span className={mediaConsent ? 'text-blue-700 font-medium' : 'text-orange-700 font-medium'}>
                  Photo/Video: {mediaConsent ? 'Granted' : 'Denied'}
                </span>
              </div>
            </div>

            {/* User agent */}
            {userAgent && (
              <p className="mt-2 text-[10px] text-gray-400 truncate border-t border-gray-200 pt-1.5">
                <span className="font-medium text-gray-500">Browser: </span>{userAgent}
              </p>
            )}
          </div>
        </div>

        {/* Agreement content — read-only */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {hasAgreed ? (
            <AgreementBody mediaConsent={mediaConsent} readOnly />
          ) : (
            <div className="py-8 text-center text-amber-700">
              <ShieldX className="w-10 h-10 mx-auto mb-3 text-amber-400" />
              <p className="font-semibold">No agreement on file</p>
              <p className="text-sm mt-1 text-amber-600">This registration predates the agreement system.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0 bg-gray-50 rounded-b-2xl">
          {hasAgreed && (
            <div className="flex items-center gap-2 mb-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
              <p className="text-xs text-green-800">
                <strong>Parent/Guardian confirmed:</strong> I am the parent/legal guardian. I have read and agree to the STEM Workshop Agreement, including the liability waiver, indemnification, medical authorization, and pickup policy.
              </p>
            </div>
          )}
          <Button className="w-full" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}
