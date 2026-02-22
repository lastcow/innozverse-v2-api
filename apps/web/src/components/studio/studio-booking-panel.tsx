'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { bookStudioSession } from '@/app/actions/studio'
import { toast } from 'sonner'
import { Clock, Users, Loader2, CheckCircle2, CalendarDays } from 'lucide-react'

interface SlotData {
  id: string
  startTime: string
  endTime: string
  capacity: number
  confirmedCount: number
  userBooked: boolean
}

interface StudioBookingPanelProps {
  slotsByDate: Record<string, SlotData[]>
  selectedDate: string | null
  currentMonth: Date
  isAuthenticated: boolean
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDateHeading(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatShortDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function StudioBookingPanel({
  slotsByDate,
  selectedDate,
  currentMonth,
  isAuthenticated,
}: StudioBookingPanelProps) {
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [acknowledged, setAcknowledged] = useState(false)
  const [loading, setLoading] = useState(false)
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    Object.values(slotsByDate)
      .flat()
      .forEach((s) => {
        if (s.userBooked) initial.add(s.id)
      })
    return initial
  })

  // Get all dates in the current month that have slots
  const monthDates = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    return Object.keys(slotsByDate)
      .filter((dateStr) => {
        const d = new Date(dateStr + 'T00:00:00')
        return d.getFullYear() === year && d.getMonth() === month
      })
      .sort()
  }, [slotsByDate, currentMonth])

  async function handleBook() {
    if (!selectedSlotId) return
    setLoading(true)
    try {
      const result = await bookStudioSession(selectedSlotId)
      if (result.success) {
        toast.success('Session booked successfully!')
        setBookedSlots((prev) => new Set(prev).add(selectedSlotId))
        setSelectedSlotId(null)
        setAcknowledged(false)
      } else {
        toast.error(result.error || 'Failed to book session.')
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  function renderSlotCard(slot: SlotData, showDate?: string) {
    const isFull = slot.confirmedCount >= slot.capacity
    const isBooked = bookedSlots.has(slot.id)
    const isSelected = selectedSlotId === slot.id
    const spotsLeft = slot.capacity - slot.confirmedCount

    if (isBooked) {
      return (
        <div
          key={slot.id}
          className="flex items-center gap-3 rounded-xl border-2 border-green-200 bg-green-50 p-4"
        >
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <div className="min-w-0">
            {showDate && (
              <p className="text-xs text-green-600 mb-0.5">{formatShortDate(showDate)}</p>
            )}
            <p className="text-sm font-semibold text-green-700">
              {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
            </p>
            <p className="text-xs text-green-600">Booked</p>
          </div>
        </div>
      )
    }

    return (
      <button
        key={slot.id}
        onClick={() => setSelectedSlotId(isSelected ? null : slot.id)}
        disabled={isFull}
        className={`text-left rounded-xl border-2 p-4 transition-all ${
          isFull
            ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
            : isSelected
              ? 'border-[#4379EE] bg-blue-50'
              : 'border-gray-200 hover:border-[#4379EE]/50'
        }`}
      >
        {showDate && (
          <p className="text-xs text-gray-400 mb-0.5">{formatShortDate(showDate)}</p>
        )}
        <p className="text-sm font-semibold text-[#202224]">
          {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
        </p>
        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
          <Users className="w-3.5 h-3.5" />
          {isFull ? 'Full' : `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left`}
        </p>
      </button>
    )
  }

  function renderConfirmSection() {
    if (!selectedSlotId || bookedSlots.has(selectedSlotId)) return null

    return (
      <div className="border-t border-gray-100 pt-6 space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={acknowledged}
            onCheckedChange={(v) => setAcknowledged(v === true)}
            className="mt-0.5"
          />
          <span className="text-sm text-gray-600 leading-relaxed">
            I understand that Open Studio is a parent-guided environment. A parent
            or guardian must be present during the entire session.
          </span>
        </label>

        {!isAuthenticated ? (
          <Button asChild className="w-full">
            <Link
              href={`/auth/login?callbackUrl=${encodeURIComponent('/youth-program/open-studio')}`}
            >
              Log in to Book
            </Link>
          </Button>
        ) : (
          <Button
            onClick={handleBook}
            disabled={!acknowledged || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Booking...
              </>
            ) : (
              'Confirm Booking'
            )}
          </Button>
        )}
      </div>
    )
  }

  // Selected date view — show slots for that specific day
  if (selectedDate) {
    const slots = slotsByDate[selectedDate] ?? []

    if (slots.length === 0) {
      return (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No sessions available</p>
          <p className="text-gray-400 text-sm mt-2">
            There are no open studio slots on this date. Try another day.
          </p>
        </div>
      )
    }

    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-[#202224] mb-1">
          {formatDateHeading(selectedDate)}
        </h3>
        <p className="text-sm text-gray-400 mb-6">Select a time slot below</p>

        <div className="grid sm:grid-cols-2 gap-3 mb-8">
          {slots.map((slot) => renderSlotCard(slot))}
        </div>

        {renderConfirmSection()}
      </div>
    )
  }

  // Month overview — show all upcoming slots grouped by date
  if (monthDates.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
        <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No sessions in {formatMonthYear(currentMonth)}</p>
        <p className="text-gray-400 text-sm mt-2">
          Try navigating to another month on the calendar.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-[#202224] mb-1">
          Upcoming in {formatMonthYear(currentMonth)}
        </h3>
        <p className="text-sm text-gray-400 mb-6">
          All available sessions this month — select a date on the calendar to filter
        </p>

        <div className="space-y-6">
          {monthDates.map((dateStr) => {
            const daySlots = slotsByDate[dateStr] ?? []
            return (
              <div key={dateStr}>
                <h4 className="text-sm font-semibold text-[#4379EE] mb-3">
                  {formatDateHeading(dateStr)}
                </h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  {daySlots.map((slot) => renderSlotCard(slot))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-8">
          {renderConfirmSection()}
        </div>
      </div>
    </div>
  )
}
