import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { sendEmail } from '@/lib/email/send'
import {
  buildWorkshopReminderEmail,
  type WorkshopReminderData,
} from '@/lib/email/workshop-reminder'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const windowStart = now
  const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const workshops = await prisma.workshop.findMany({
    where: {
      isPublished: true,
      startDate: {
        gte: windowStart,
        lte: windowEnd,
      },
    },
    include: {
      registrations: {
        include: {
          user: {
            select: {
              email: true,
              fname: true,
              lname: true,
            },
          },
        },
      },
      products: {
        include: {
          product: {
            select: {
              name: true,
            },
          },
        },
      },
      _count: {
        select: { registrations: true },
      },
    },
  })

  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'
  let totalSent = 0

  for (const workshop of workshops) {
    const tz = 'America/New_York'
    const startDate = workshop.startDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: tz,
    })
    const startTime = workshop.startDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: tz,
    })
    const endTime = workshop.endDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: tz,
    })

    const products = workshop.products.map((wp) => ({
      name: wp.product.name,
      quantity: wp.quantity,
    }))

    for (const registration of workshop.registrations) {
      const userName =
        [registration.user.fname, registration.user.lname]
          .filter(Boolean)
          .join(' ') || 'there'

      const data: WorkshopReminderData = {
        userName,
        workshopTitle: workshop.title,
        workshopDescription: workshop.description,
        startDate,
        startTime,
        endTime,
        registrationCount: workshop.registrations.reduce((sum, r) => sum + r.seats, 0),
        capacity: workshop.capacity,
        seats: registration.seats,
        products,
        workshopUrl: `${webUrl}/workshops/${workshop.id}`,
      }

      const html = buildWorkshopReminderEmail(data)
      const result = await sendEmail({
        to: registration.user.email,
        subject: `Reminder: ${workshop.title} is today`,
        html,
      })

      if (result.success) {
        totalSent++
      } else {
        console.error(
          `Failed to send reminder to ${registration.user.email} for workshop ${workshop.id}:`,
          result.error
        )
      }
    }
  }

  return NextResponse.json({
    sent: totalSent,
    workshops: workshops.length,
  })
}
