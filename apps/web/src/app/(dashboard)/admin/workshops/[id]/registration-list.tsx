'use client'

import { useState } from 'react'
import { Users, Mail, Minus, Plus, Trash2, Loader2, ShieldCheck, ShieldX, Camera, CameraOff, Clock, Globe, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface Registration {
  id: string
  seats: number
  createdAt: string
  user: { email: string; fname: string | null; lname: string | null }
  // Consent fields
  agreementAcceptedAt: string | null
  agreementVersion: string | null
  agreementIp: string | null
  agreementUserAgent: string | null
  mediaConsentGranted: boolean
}

interface RegistrationListProps {
  registrations: Registration[]
  workshopCapacity: number
}

const formatDateTime = (date: string) =>
  new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

export function RegistrationList({ registrations: initial, workshopCapacity }: RegistrationListProps) {
  const { accessToken } = useAuth()
  const [registrations, setRegistrations] = useState(initial)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const totalSeats = registrations.reduce((sum, r) => sum + r.seats, 0)
  const agreedCount = registrations.filter((r) => r.agreementAcceptedAt).length
  const mediaGrantedCount = registrations.filter((r) => r.mediaConsentGranted).length

  async function handleUpdateSeats(regId: string, newSeats: number) {
    if (newSeats < 1) return
    setUpdatingId(regId)
    try {
      const res = await fetch(`${apiUrl}/api/v1/workshops/registrations/${regId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ seats: newSeats }),
      })
      if (res.ok) {
        setRegistrations((prev) =>
          prev.map((r) => (r.id === regId ? { ...r, seats: newSeats } : r))
        )
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update seats')
      }
    } catch {
      toast.error('Failed to update seats')
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleDelete(regId: string) {
    setDeletingId(regId)
    try {
      const res = await fetch(`${apiUrl}/api/v1/workshops/registrations/${regId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (res.ok) {
        setRegistrations((prev) => prev.filter((r) => r.id !== regId))
        toast.success('Registration cancelled')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to cancel registration')
      }
    } catch {
      toast.error('Failed to cancel registration')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#4379EE]" />
          <h2 className="text-lg font-semibold text-[#202224]">
            Registered Participants ({registrations.length} registrations, {totalSeats} seats)
          </h2>
        </div>

        {/* Consent summary badges */}
        {registrations.length > 0 && (
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-1">
              <ShieldCheck className="w-3 h-3" />
              {agreedCount}/{registrations.length} agreed
            </span>
            <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 border ${mediaGrantedCount === registrations.length ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
              <Camera className="w-3 h-3" />
              {mediaGrantedCount}/{registrations.length} media consent
            </span>
          </div>
        )}
      </div>

      {registrations.length === 0 ? (
        <div className="py-8 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No registrations yet</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {registrations.map((reg, i) => {
            const name =
              [reg.user.fname, reg.user.lname].filter(Boolean).join(' ') || null
            const isUpdating = updatingId === reg.id
            const isDeleting = deletingId === reg.id
            const isExpanded = expandedId === reg.id
            const hasAgreed = !!reg.agreementAcceptedAt

            return (
              <div key={reg.id} className="py-3">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-400 w-6 text-right">{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-[#4379EE] flex items-center justify-center text-white text-xs font-medium shrink-0">
                    {reg.user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#202224] truncate">
                      {name || reg.user.email}
                    </p>
                    {name && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3" />
                        {reg.user.email}
                      </p>
                    )}
                  </div>

                  {/* Consent status icons + IP */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {hasAgreed ? (
                      <span title={`Agreement signed ${formatDateTime(reg.agreementAcceptedAt!)}`}>
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                      </span>
                    ) : (
                      <span title="No agreement on record">
                        <ShieldX className="w-4 h-4 text-gray-300" />
                      </span>
                    )}
                    {reg.mediaConsentGranted ? (
                      <span title="Photo/video consent granted">
                        <Camera className="w-4 h-4 text-blue-400" />
                      </span>
                    ) : (
                      <span title="Photo/video consent denied">
                        <CameraOff className="w-4 h-4 text-orange-400" />
                      </span>
                    )}
                    {reg.agreementIp && (
                      <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-gray-400 bg-gray-100 rounded px-1.5 py-0.5" title="IP at time of agreement">
                        <Globe className="w-2.5 h-2.5" />
                        {reg.agreementIp}
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-gray-400 shrink-0 hidden sm:inline">
                    {formatDateTime(reg.createdAt)}
                  </span>

                  {/* Seats stepper */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleUpdateSeats(reg.id, reg.seats - 1)}
                      disabled={reg.seats <= 1 || isUpdating}
                      className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium text-[#202224]">
                      {isUpdating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto text-gray-400" />
                      ) : (
                        reg.seats
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateSeats(reg.id, reg.seats + 1)}
                      disabled={isUpdating || (workshopCapacity > 0 && totalSeats >= workshopCapacity)}
                      className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <span className="text-xs text-gray-400 ml-0.5">seats</span>
                  </div>

                  {/* Expand consent details */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : reg.id)}
                    className="w-7 h-7 rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0"
                    title="View consent details"
                  >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {/* Cancel button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(reg.id)}
                    disabled={isDeleting}
                    className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors shrink-0 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Expanded consent details */}
                {isExpanded && (
                  <div className="ml-14 mt-2 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 space-y-2 text-xs">
                    <p className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-1">Consent & Agreement Record</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Agreement status */}
                      <div className="flex items-start gap-2">
                        {hasAgreed ? (
                          <ShieldCheck className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                        ) : (
                          <ShieldX className="w-3.5 h-3.5 text-gray-300 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <p className="text-gray-500">Agreement</p>
                          <p className={`font-medium ${hasAgreed ? 'text-green-700' : 'text-gray-400'}`}>
                            {hasAgreed ? `Signed` : 'Not on record'}
                          </p>
                          {reg.agreementVersion && (
                            <p className="text-gray-400">{reg.agreementVersion}</p>
                          )}
                        </div>
                      </div>

                      {/* Signed at */}
                      {reg.agreementAcceptedAt && (
                        <div className="flex items-start gap-2">
                          <Clock className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-gray-500">Signed At</p>
                            <p className="font-medium text-gray-700">{formatDateTime(reg.agreementAcceptedAt)}</p>
                          </div>
                        </div>
                      )}

                      {/* Media consent */}
                      <div className="flex items-start gap-2">
                        {reg.mediaConsentGranted ? (
                          <Camera className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                        ) : (
                          <CameraOff className="w-3.5 h-3.5 text-orange-400 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <p className="text-gray-500">Photo/Video Consent</p>
                          <p className={`font-medium ${reg.mediaConsentGranted ? 'text-blue-700' : 'text-orange-600'}`}>
                            {reg.mediaConsentGranted ? 'Granted' : 'Denied — do not photograph'}
                          </p>
                        </div>
                      </div>

                      {/* IP address */}
                      {reg.agreementIp && (
                        <div className="flex items-start gap-2">
                          <Globe className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-gray-500">IP Address</p>
                            <p className="font-medium text-gray-700 font-mono">{reg.agreementIp}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* User agent */}
                    {reg.agreementUserAgent && (
                      <div className="border-t border-gray-200 pt-2">
                        <p className="text-gray-400 text-[10px] truncate" title={reg.agreementUserAgent}>
                          <span className="font-medium text-gray-500">Browser: </span>
                          {reg.agreementUserAgent}
                        </p>
                      </div>
                    )}

                    {!hasAgreed && (
                      <div className="border-t border-gray-200 pt-2 text-amber-600 flex items-center gap-1">
                        <span>⚠️</span>
                        <span>This registration predates the agreement system — no consent record exists.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
