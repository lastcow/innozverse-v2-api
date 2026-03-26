import { Hono } from 'hono'
import { db } from '@repo/database'
import { authMiddleware } from '../middleware/auth'

const AGREEMENT_VERSION = 'MD-STEM-v1-2026-03-26'

const app = new Hono()

// ─── POST /api/v1/workshops/:id/register ────────────────────────────────────
app.post('/api/v1/workshops/:id/register', authMiddleware, async (c) => {
  const userId = c.get('userId') as string
  const workshopId = c.req.param('id')

  const body = await c.req.json<{
    seats?: number
    mediaConsentGranted?: boolean
    agreedAt?: string   // client-side ISO timestamp (supporting evidence only)
  }>().catch(() => ({}))

  const seats = Math.max(1, Math.min(Number(body.seats) || 1, 50))
  const mediaConsentGranted = body.mediaConsentGranted !== false  // default true

  // Extract IP (Cloudflare → Vercel → fallback)
  const ip =
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    'unknown'

  const userAgent = c.req.header('user-agent') || null
  const agreementAcceptedAt = new Date()  // server timestamp (authoritative)

  // Fetch workshop
  const workshop = await db.workshop.findUnique({
    where: { id: workshopId },
    select: { id: true, capacity: true, isPublished: true },
  })

  if (!workshop || !workshop.isPublished) {
    return c.json({ error: 'Workshop not found.' }, 404)
  }

  // Check existing registration
  const existing = await db.workshopRegistration.findUnique({
    where: { userId_workshopId: { userId, workshopId } },
  })
  if (existing) {
    return c.json({ error: 'Already registered.' }, 409)
  }

  // Check capacity
  if (workshop.capacity !== null) {
    const takenSeats = await db.workshopRegistration.aggregate({
      where: { workshopId },
      _sum: { seats: true },
    })
    const taken = takenSeats._sum.seats ?? 0
    if (taken + seats > workshop.capacity) {
      return c.json({ error: 'Not enough seats available.' }, 409)
    }
  }

  // Create registration with full consent record
  const registration = await db.workshopRegistration.create({
    data: {
      userId,
      workshopId,
      seats,
      agreementAcceptedAt,
      agreementVersion: AGREEMENT_VERSION,
      agreementIp: ip,
      agreementUserAgent: userAgent,
      mediaConsentGranted,
    },
  })

  return c.json({
    success: true,
    registrationId: registration.id,
    seats: registration.seats,
    agreementVersion: AGREEMENT_VERSION,
    agreementAcceptedAt: agreementAcceptedAt.toISOString(),
    mediaConsentGranted,
  }, 201)
})

// ─── DELETE /api/v1/workshops/:id/register ───────────────────────────────────
app.delete('/api/v1/workshops/:id/register', authMiddleware, async (c) => {
  const userId = c.get('userId') as string
  const workshopId = c.req.param('id')

  const existing = await db.workshopRegistration.findUnique({
    where: { userId_workshopId: { userId, workshopId } },
  })
  if (!existing) {
    return c.json({ error: 'Not registered.' }, 404)
  }

  await db.workshopRegistration.delete({
    where: { userId_workshopId: { userId, workshopId } },
  })

  return c.json({ success: true })
})

// ─── GET /api/v1/workshops/my ────────────────────────────────────────────────
app.get('/api/v1/workshops/my', authMiddleware, async (c) => {
  const userId = c.get('userId') as string

  const registrations = await db.workshopRegistration.findMany({
    where: { userId },
    include: {
      workshop: {
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          location: true,
          isPublished: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return c.json({ registrations })
})

export default app
