'use client'

import { useState } from 'react'
import { StudioCalendar } from '@/components/studio/studio-calendar'
import { StudioBookingPanel } from '@/components/studio/studio-booking-panel'

interface SlotData {
  id: string
  startTime: string
  endTime: string
  capacity: number
  confirmedCount: number
  userBooked: boolean
}

interface OpenStudioClientProps {
  availableDays: string[]
  slotsByDate: Record<string, SlotData[]>
  isAuthenticated: boolean
}

export function OpenStudioClient({
  availableDays,
  slotsByDate,
  isAuthenticated,
}: OpenStudioClientProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

  return (
    <div className="grid lg:grid-cols-[350px_1fr] gap-8">
      <aside>
        <StudioCalendar
          availableDays={availableDays}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onMonthChange={setCurrentMonth}
        />
      </aside>
      <main>
        <StudioBookingPanel
          slotsByDate={slotsByDate}
          selectedDate={selectedDate}
          currentMonth={currentMonth}
          isAuthenticated={isAuthenticated}
        />
      </main>
    </div>
  )
}
