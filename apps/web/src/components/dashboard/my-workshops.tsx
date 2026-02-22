'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cancelWorkshopRegistration } from '@/app/actions/workshop'
import { toast } from 'sonner'
import { CalendarDays, Users, ExternalLink, Loader2 } from 'lucide-react'

interface WorkshopRegistration {
  registrationId: string
  workshopId: string
  title: string
  description: string
  imageUrls: string[]
  startDate: string
  endDate: string
  capacity: number
  registered: number
  registeredAt: string
}

interface MyWorkshopsProps {
  workshops: WorkshopRegistration[]
}

function formatDateRange(start: string, end: string) {
  const opts: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }
  return `${new Date(start).toLocaleDateString('en-US', opts)} - ${new Date(end).toLocaleDateString('en-US', opts)}`
}

function getStatus(startDate: string, endDate: string) {
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (now < start) return 'upcoming'
  if (now > end) return 'past'
  return 'active'
}

export function MyWorkshops({ workshops }: MyWorkshopsProps) {
  const [items, setItems] = useState(workshops)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const upcoming = items.filter((w) => getStatus(w.startDate, w.endDate) === 'upcoming')
  const active = items.filter((w) => getStatus(w.startDate, w.endDate) === 'active')
  const past = items.filter((w) => getStatus(w.startDate, w.endDate) === 'past')

  async function handleCancel(workshopId: string) {
    setCancellingId(workshopId)
    try {
      const result = await cancelWorkshopRegistration(workshopId)
      if (result.success) {
        setItems((prev) => prev.filter((w) => w.workshopId !== workshopId))
        toast.success('Registration cancelled.')
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
        <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No workshop registrations yet.</p>
        <p className="text-gray-400 text-sm mt-2 mb-6">
          Browse upcoming workshops and register for one!
        </p>
        <Button asChild>
          <Link href="/workshops">Browse Workshops</Link>
        </Button>
      </div>
    )
  }

  function renderSection(title: string, list: WorkshopRegistration[], showCancel: boolean) {
    if (list.length === 0) return null
    return (
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[#202224] mb-4">{title}</h2>
        <div className="space-y-4">
          {list.map((w) => {
            const images = Array.isArray(w.imageUrls) ? w.imageUrls : []
            const seatsText =
              w.capacity > 0
                ? `${w.registered} / ${w.capacity} seats taken`
                : null

            return (
              <div
                key={w.registrationId}
                className="bg-white rounded-2xl shadow-sm overflow-hidden"
              >
                <div className="sm:flex">
                  {images[0] ? (
                    <div className="relative sm:w-44 h-36 sm:h-auto flex-shrink-0">
                      <Image
                        src={images[0]}
                        alt={w.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 176px"
                      />
                    </div>
                  ) : (
                    <div className="sm:w-44 h-36 sm:h-auto bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0">
                      <CalendarDays className="w-10 h-10 text-[#4379EE]/30" />
                    </div>
                  )}
                  <div className="p-5 flex-1 min-w-0 flex flex-col">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-[#202224] mb-1">
                        {w.title}
                      </h3>
                      <p className="text-sm text-[#4379EE] font-medium mb-1">
                        {formatDateRange(w.startDate, w.endDate)}
                      </p>
                      {seatsText && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mb-2">
                          <Users className="w-3.5 h-3.5" />
                          {seatsText}
                        </p>
                      )}
                      <p className="text-gray-500 text-sm line-clamp-2">
                        {w.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/workshops/${w.workshopId}`}>
                          <ExternalLink className="w-3.5 h-3.5" />
                          View Details
                        </Link>
                      </Button>
                      {showCancel && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancel(w.workshopId)}
                          disabled={cancellingId === w.workshopId}
                        >
                          {cancellingId === w.workshopId ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Cancelling...
                            </>
                          ) : (
                            'Cancel Registration'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div>
      {renderSection('Happening Now', active, false)}
      {renderSection('Upcoming', upcoming, true)}
      {renderSection('Past', past, false)}
    </div>
  )
}
