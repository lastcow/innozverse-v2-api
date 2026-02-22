'use client'

import { useMemo } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'

interface WorkshopCalendarProps {
  workshopDays: string[]
}

export function WorkshopCalendar({ workshopDays }: WorkshopCalendarProps) {
  const highlightedDays = useMemo(
    () => workshopDays.map((d) => new Date(d)),
    [workshopDays]
  )

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex justify-center">
      <DayPicker
        modifiers={{ workshop: highlightedDays }}
        modifiersStyles={{
          workshop: {
            backgroundColor: '#4379EE',
            color: 'white',
            borderRadius: '50%',
          },
        }}
      />
    </div>
  )
}
