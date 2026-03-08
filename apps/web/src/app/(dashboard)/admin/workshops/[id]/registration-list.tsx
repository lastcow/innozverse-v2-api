'use client'

import { useState } from 'react'
import { Users, Mail, Minus, Plus, Trash2, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface Registration {
  id: string
  seats: number
  createdAt: string
  user: { email: string; fname: string | null; lname: string | null }
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

  const totalSeats = registrations.reduce((sum, r) => sum + r.seats, 0)

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
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-[#4379EE]" />
        <h2 className="text-lg font-semibold text-[#202224]">
          Registered Participants ({registrations.length} registrations, {totalSeats} seats)
        </h2>
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

            return (
              <div
                key={reg.id}
                className="flex items-center gap-4 py-3"
              >
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
            )
          })}
        </div>
      )}
    </div>
  )
}
