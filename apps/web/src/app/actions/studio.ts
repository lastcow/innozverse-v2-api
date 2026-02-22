'use server'

import { prisma } from '@repo/database'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

export async function bookStudioSession(slotId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in to book a session.' }
  }

  const userId = session.user.id

  try {
    const slot = await prisma.studioSlot.findUnique({
      where: { id: slotId },
      include: {
        _count: {
          select: { bookings: { where: { status: 'CONFIRMED' } } },
        },
      },
    })

    if (!slot || !slot.isAvailable) {
      return { success: false, error: 'This time slot is not available.' }
    }

    if (slot._count.bookings >= slot.capacity) {
      return { success: false, error: 'This time slot is full.' }
    }

    const existing = await prisma.studioBooking.findUnique({
      where: { userId_slotId: { userId, slotId } },
    })

    if (existing) {
      if (existing.status === 'CONFIRMED') {
        return { success: false, error: 'You have already booked this session.' }
      }
      // Re-confirm a previously cancelled booking
      await prisma.studioBooking.update({
        where: { id: existing.id },
        data: { status: 'CONFIRMED' },
      })
    } else {
      await prisma.studioBooking.create({
        data: { userId, slotId },
      })
    }

    revalidatePath('/youth-program/open-studio')
    revalidatePath('/user/studio-bookings')

    return { success: true }
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return { success: false, error: 'You have already booked this session.' }
    }
    console.error('Failed to book studio session:', error)
    return { success: false, error: 'Failed to book. Please try again.' }
  }
}

export async function cancelStudioBooking(bookingId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in.' }
  }

  try {
    const booking = await prisma.studioBooking.findUnique({
      where: { id: bookingId },
    })

    if (!booking || booking.userId !== session.user.id) {
      return { success: false, error: 'Booking not found.' }
    }

    if (booking.status !== 'CONFIRMED') {
      return { success: false, error: 'This booking is not active.' }
    }

    await prisma.studioBooking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    })

    revalidatePath('/youth-program/open-studio')
    revalidatePath('/user/studio-bookings')

    return { success: true }
  } catch {
    return { success: false, error: 'Failed to cancel booking.' }
  }
}
