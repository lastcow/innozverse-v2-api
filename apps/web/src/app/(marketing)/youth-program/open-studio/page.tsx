import { auth } from '@/auth'
import { OpenStudioClient } from './client'
import { StudioHero } from '@/components/studio/studio-hero'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface SlotData {
  id: string
  startTime: string
  endTime: string
  capacity: number
  confirmedCount: number
  userBooked: boolean
}

export default async function OpenStudioPage() {
  const session = await auth()
  const userId = session?.user?.id ?? null

  const headers: Record<string, string> = {}
  if (session?.accessToken) {
    headers['Authorization'] = `Bearer ${session.accessToken}`
  }

  const res = await fetch(`${apiUrl}/api/v1/studio-slots`, {
    cache: 'no-store',
    headers,
  })

  const { slots } = (await res.json()) as { slots: SlotData[] }

  // Build slotsByDate and availableDays
  const slotsByDate: Record<
    string,
    {
      id: string
      startTime: string
      endTime: string
      capacity: number
      confirmedCount: number
      userBooked: boolean
    }[]
  > = {}

  const availableDaysSet = new Set<string>()

  for (const slot of slots) {
    const dateKey = slot.startTime.split('T')[0]!
    availableDaysSet.add(dateKey)
    if (!slotsByDate[dateKey]) slotsByDate[dateKey] = []
    slotsByDate[dateKey]!.push({
      id: slot.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      capacity: slot.capacity,
      confirmedCount: slot.confirmedCount,
      userBooked: slot.userBooked,
    })
  }

  const availableDays = Array.from(availableDaysSet).sort()

  return (
    <>
    <StudioHero />

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <OpenStudioClient
        availableDays={availableDays}
        slotsByDate={slotsByDate}
        isAuthenticated={!!userId}
      />
    </div>
    </>
  )
}
