'use server'

import { prisma } from '@repo/database'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Not authenticated')
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SYSTEM')) {
    throw new Error('Not authorized')
  }
  return user
}

export async function getStudioSlots() {
  await requireAdmin()

  const slots = await prisma.studioSlot.findMany({
    orderBy: { startTime: 'asc' },
    include: {
      _count: {
        select: { bookings: { where: { status: 'CONFIRMED' } } },
      },
    },
  })

  return slots.map((s) => ({
    id: s.id,
    startTime: s.startTime.toISOString(),
    endTime: s.endTime.toISOString(),
    capacity: s.capacity,
    isAvailable: s.isAvailable,
    confirmedBookings: s._count.bookings,
    createdAt: s.createdAt.toISOString(),
  }))
}

export async function createStudioSlot(data: {
  startTime: string
  endTime: string
  capacity: number
  isAvailable: boolean
}) {
  await requireAdmin()

  const start = new Date(data.startTime)
  const end = new Date(data.endTime)

  if (end <= start) {
    return { success: false, error: 'End time must be after start time.' }
  }

  try {
    await prisma.studioSlot.create({
      data: {
        startTime: start,
        endTime: end,
        capacity: data.capacity,
        isAvailable: data.isAvailable,
      },
    })

    revalidatePath('/admin/studio-slots')
    revalidatePath('/youth-program/open-studio')

    return { success: true }
  } catch (error) {
    console.error('Failed to create studio slot:', error)
    return { success: false, error: 'Failed to create slot.' }
  }
}

export async function updateStudioSlot(
  slotId: string,
  data: {
    startTime: string
    endTime: string
    capacity: number
    isAvailable: boolean
  }
) {
  await requireAdmin()

  const start = new Date(data.startTime)
  const end = new Date(data.endTime)

  if (end <= start) {
    return { success: false, error: 'End time must be after start time.' }
  }

  try {
    await prisma.studioSlot.update({
      where: { id: slotId },
      data: {
        startTime: start,
        endTime: end,
        capacity: data.capacity,
        isAvailable: data.isAvailable,
      },
    })

    revalidatePath('/admin/studio-slots')
    revalidatePath('/youth-program/open-studio')

    return { success: true }
  } catch (error) {
    console.error('Failed to update studio slot:', error)
    return { success: false, error: 'Failed to update slot.' }
  }
}

export async function deleteStudioSlot(slotId: string) {
  await requireAdmin()

  try {
    await prisma.studioSlot.delete({ where: { id: slotId } })

    revalidatePath('/admin/studio-slots')
    revalidatePath('/youth-program/open-studio')

    return { success: true }
  } catch (error) {
    console.error('Failed to delete studio slot:', error)
    return { success: false, error: 'Failed to delete slot. It may have active bookings.' }
  }
}

export async function toggleSlotAvailability(slotId: string, isAvailable: boolean) {
  await requireAdmin()

  try {
    await prisma.studioSlot.update({
      where: { id: slotId },
      data: { isAvailable },
    })

    revalidatePath('/admin/studio-slots')
    revalidatePath('/youth-program/open-studio')

    return { success: true }
  } catch (error) {
    console.error('Failed to toggle slot availability:', error)
    return { success: false, error: 'Failed to update slot.' }
  }
}
