'use client'

import { useMemo } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'

interface StudioCalendarProps {
  availableDays: string[]
  selectedDate: string | null
  onSelectDate: (date: string | null) => void
  onMonthChange: (month: Date) => void
}

export function StudioCalendar({
  availableDays,
  selectedDate,
  onSelectDate,
  onMonthChange,
}: StudioCalendarProps) {
  const highlightedDays = useMemo(
    () => availableDays.map((d) => new Date(d)),
    [availableDays]
  )

  const selected = selectedDate ? new Date(selectedDate) : undefined

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex justify-center">
      <DayPicker
        mode="single"
        selected={selected}
        onMonthChange={onMonthChange}
        onSelect={(day) => {
          if (day) {
            const y = day.getFullYear()
            const m = String(day.getMonth() + 1).padStart(2, '0')
            const d = String(day.getDate()).padStart(2, '0')
            onSelectDate(`${y}-${m}-${d}`)
          } else {
            onSelectDate(null)
          }
        }}
        disabled={(day) => {
          const y = day.getFullYear()
          const m = String(day.getMonth() + 1).padStart(2, '0')
          const d = String(day.getDate()).padStart(2, '0')
          return !availableDays.includes(`${y}-${m}-${d}`)
        }}
        modifiers={{ available: highlightedDays }}
        modifiersStyles={{
          available: {
            backgroundColor: '#EFF6FF',
            color: '#4379EE',
            borderRadius: '50%',
            fontWeight: 600,
          },
        }}
      />
    </div>
  )
}
