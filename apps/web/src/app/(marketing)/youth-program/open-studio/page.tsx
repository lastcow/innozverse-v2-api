import { prisma } from '@repo/database'
import { auth } from '@/auth'
import { OpenStudioClient } from './client'
import { StudioHero } from '@/components/studio/studio-hero'

export default async function OpenStudioPage() {
  const session = await auth()
  const userId = session?.user?.id ?? null

  const now = new Date()

  const slots = await prisma.studioSlot.findMany({
    where: {
      isAvailable: true,
      startTime: { gte: now },
    },
    include: {
      _count: {
        select: { bookings: { where: { status: 'CONFIRMED' } } },
      },
      ...(userId
        ? {
            bookings: {
              where: { userId, status: 'CONFIRMED' },
              select: { id: true },
            },
          }
        : {}),
    },
    orderBy: { startTime: 'asc' },
  })

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
    const dateKey = slot.startTime.toISOString().split('T')[0]!
    availableDaysSet.add(dateKey)
    if (!slotsByDate[dateKey]) slotsByDate[dateKey] = []
    slotsByDate[dateKey]!.push({
      id: slot.id,
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString(),
      capacity: slot.capacity,
      confirmedCount: slot._count.bookings,
      userBooked:
        'bookings' in slot && Array.isArray(slot.bookings)
          ? slot.bookings.length > 0
          : false,
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
