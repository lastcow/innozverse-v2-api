'use server'

import { prisma } from '@repo/database'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

export async function registerForWorkshop(workshopId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in to register.' }
  }

  const userId = session.user.id

  try {
    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      include: { _count: { select: { registrations: true } } },
    })

    if (!workshop || !workshop.isPublished) {
      return { success: false, error: 'Workshop not found.' }
    }

    if (new Date(workshop.endDate) < new Date()) {
      return { success: false, error: 'This workshop has already ended.' }
    }

    if (workshop.capacity > 0 && workshop._count.registrations >= workshop.capacity) {
      return { success: false, error: 'This workshop is full.' }
    }

    const existing = await prisma.workshopRegistration.findUnique({
      where: { userId_workshopId: { userId, workshopId } },
    })

    if (existing) {
      return { success: false, error: 'You are already registered for this workshop.' }
    }

    await prisma.workshopRegistration.create({
      data: { userId, workshopId },
    })

    revalidatePath('/workshops')
    revalidatePath(`/workshops/${workshopId}`)
    revalidatePath('/user/workshops')

    return { success: true }
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return { success: false, error: 'You are already registered for this workshop.' }
    }
    console.error('Failed to register for workshop:', error)
    return { success: false, error: 'Failed to register. Please try again.' }
  }
}

export async function cancelWorkshopRegistration(workshopId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in.' }
  }

  try {
    await prisma.workshopRegistration.delete({
      where: {
        userId_workshopId: {
          userId: session.user.id,
          workshopId,
        },
      },
    })

    revalidatePath('/workshops')
    revalidatePath(`/workshops/${workshopId}`)
    revalidatePath('/user/workshops')

    return { success: true }
  } catch {
    return { success: false, error: 'Failed to cancel registration.' }
  }
}
