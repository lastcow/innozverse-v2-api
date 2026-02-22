'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cancelStudioBooking } from '@/app/actions/studio'
import { toast } from 'sonner'
import { Clock, Loader2 } from 'lucide-react'

interface StudioBookingItem {
  bookingId: string
  slotId: string
  startTime: string
  endTime: string
  status: string
  bookedAt: string
}

interface MyStudioBookingsProps {
  bookings: StudioBookingItem[]
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function MyStudioBookings({ bookings }: MyStudioBookingsProps) {
  const [items, setItems] = useState(bookings)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const now = new Date()
  const confirmed = items.filter((b) => b.status === 'CONFIRMED')
  const upcoming = confirmed.filter((b) => new Date(b.startTime) > now)
  const past = confirmed.filter((b) => new Date(b.endTime) <= now)
  const cancelled = items.filter((b) => b.status === 'CANCELLED')

  async function handleCancel(bookingId: string) {
    setCancellingId(bookingId)
    try {
      const result = await cancelStudioBooking(bookingId)
      if (result.success) {
        setItems((prev) =>
          prev.map((b) =>
            b.bookingId === bookingId ? { ...b, status: 'CANCELLED' } : b
          )
        )
        toast.success('Booking cancelled.')
      } else {
        toast.error(result.error || 'Failed to cancel.')
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setCancellingId(null)
    }
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No studio bookings yet.</p>
        <p className="text-gray-400 text-sm mt-2 mb-6">
          Book an Open Studio session to get started!
        </p>
        <Button asChild>
          <Link href="/youth-program/open-studio">Browse Sessions</Link>
        </Button>
      </div>
    )
  }

  function renderSection(
    title: string,
    list: StudioBookingItem[],
    showCancel: boolean
  ) {
    if (list.length === 0) return null
    return (
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[#202224] mb-4">{title}</h2>
        <div className="space-y-3">
          {list.map((b) => (
            <div
              key={b.bookingId}
              className="bg-white rounded-2xl shadow-sm p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-[#202224]">
                    {formatDateTime(b.startTime)}
                  </p>
                  <p className="text-sm text-[#4379EE] font-medium mt-0.5">
                    {formatTime(b.startTime)} – {formatTime(b.endTime)}
                  </p>
                  {b.status === 'CANCELLED' && (
                    <span className="inline-block mt-2 text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                      Cancelled
                    </span>
                  )}
                </div>
                {showCancel && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleCancel(b.bookingId)}
                    disabled={cancellingId === b.bookingId}
                  >
                    {cancellingId === b.bookingId ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      'Cancel'
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {renderSection('Upcoming Sessions', upcoming, true)}
      {renderSection('Past Sessions', past, false)}
      {renderSection('Cancelled', cancelled, false)}
    </div>
  )
}
