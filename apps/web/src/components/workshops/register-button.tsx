'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { Loader2, Minus, Plus } from 'lucide-react'
import { AgreementModal } from './agreement-modal'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface RegisterButtonProps {
  workshopId: string
  isAuthenticated: boolean
  isRegistered: boolean
  isFull: boolean
  isPast: boolean
  availableSeats: number | null // null = unlimited
}

export function RegisterButton({
  workshopId,
  isAuthenticated,
  isRegistered: initialRegistered,
  isFull,
  isPast,
  availableSeats,
}: RegisterButtonProps) {
  const { accessToken } = useAuth()
  const [registered, setRegistered] = useState(initialRegistered)
  const [loading, setLoading] = useState(false)
  const [seats, setSeats] = useState(1)
  const [showAgreement, setShowAgreement] = useState(false)

  if (!isAuthenticated) {
    return (
      <Button asChild size="lg" className="w-full">
        <Link href={`/auth/login?callbackUrl=/workshops/${workshopId}`}>
          Log in to Register
        </Link>
      </Button>
    )
  }

  if (registered) {
    return (
      <Button
        size="lg"
        disabled
        className="w-full bg-green-600 text-white hover:bg-green-600"
      >
        You are Registered
      </Button>
    )
  }

  if (isPast) {
    return (
      <Button size="lg" disabled className="w-full">
        Workshop Ended
      </Button>
    )
  }

  if (isFull) {
    return (
      <Button size="lg" disabled className="w-full">
        Sold Out
      </Button>
    )
  }

  const maxSeats = availableSeats ?? 99

  async function handleRegister(mediaConsentGranted = true) {
    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/api/v1/workshops/${workshopId}/register`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seats,
          mediaConsentGranted,
          agreedAt: new Date().toISOString(),
        }),
      })

      if (res.ok) {
        setRegistered(true)
        toast.success(
          `Registered for ${seats} seat${seats > 1 ? 's' : ''}!`
        )
      } else {
        const data = await res.json()
        toast.error(data.error || 'Registration failed.')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {showAgreement && (
        <AgreementModal
          onAccept={(mediaConsent) => {
            setShowAgreement(false)
            handleRegister(mediaConsent)
          }}
          onCancel={() => setShowAgreement(false)}
        />
      )}

      <div className="space-y-3">
        {/* Seat selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Seats:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSeats((s) => Math.max(1, s - 1))}
              disabled={seats <= 1}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-semibold text-[#202224]">
              {seats}
            </span>
            <button
              type="button"
              onClick={() => setSeats((s) => Math.min(maxSeats, s + 1))}
              disabled={seats >= maxSeats}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={() => setShowAgreement(true)}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Registering...
            </>
          ) : (
            `Register Now${seats > 1 ? ` (${seats} seats)` : ''}`
          )}
        </Button>
      </div>
    </>
  )
}
