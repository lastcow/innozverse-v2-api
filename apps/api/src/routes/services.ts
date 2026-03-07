import { Hono } from 'hono'
import Stripe from 'stripe'
import { prisma } from '@repo/database'
import { authMiddleware } from '../middleware/auth'
import type { AuthContext } from '../types'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

const app = new Hono<{ Variables: AuthContext }>()

// POST /api/v1/services/from-stripe - Internal webhook secret auth
app.post('/api/v1/services/from-stripe', async (c) => {
  const internalSecret = c.req.header('X-Internal-Secret')
  const expectedSecret = process.env.INTERNAL_WEBHOOK_SECRET

  if (!expectedSecret || internalSecret !== expectedSecret) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const body = await c.req.json()
    const {
      userId,
      serviceName,
      stripeSubscriptionId,
      stripeCustomerId,
      status,
      billingPeriod,
      currentPeriodStart,
      currentPeriodEnd,
      monthlyPrice,
    } = body

    if (!userId || !serviceName) {
      return c.json({ error: 'Missing required fields: userId and serviceName' }, 400)
    }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (!user) {
      console.error(`Service subscription: user not found for userId=${userId}`)
      return c.json({ error: `User not found: ${userId}` }, 404)
    }

    // Upsert ServiceSubscription by stripeSubscriptionId
    const serviceSubscription = stripeSubscriptionId
      ? await prisma.serviceSubscription.upsert({
          where: { stripeSubscriptionId },
          update: {
            status: status ?? 'PENDING_SETUP',
            billingPeriod: billingPeriod ?? 'monthly',
            monthlyPrice: monthlyPrice ?? 0,
            currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart) : undefined,
            currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : undefined,
            stripeCustomerId: stripeCustomerId ?? undefined,
            canceledAt: status === 'CANCELED' ? new Date() : null,
          },
          create: {
            userId,
            serviceName,
            stripeSubscriptionId,
            stripeCustomerId: stripeCustomerId ?? null,
            status: status ?? 'PENDING_SETUP',
            billingPeriod: billingPeriod ?? 'monthly',
            monthlyPrice: monthlyPrice ?? 0,
            currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart) : null,
            currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : null,
          },
        })
      : await prisma.serviceSubscription.create({
          data: {
            userId,
            serviceName,
            stripeCustomerId: stripeCustomerId ?? null,
            status: status ?? 'PENDING_SETUP',
            billingPeriod: billingPeriod ?? 'monthly',
            monthlyPrice: monthlyPrice ?? 0,
            currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart) : null,
            currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : null,
          },
        })

    return c.json({ serviceSubscription })
  } catch (error) {
    console.error('Failed to create/update service subscription:', error)
    const message = error instanceof Error ? error.message : 'Failed to process service subscription'
    return c.json({ error: message }, 500)
  }
})

// GET /api/v1/services/me - JWT auth
app.get('/api/v1/services/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const services = await prisma.serviceSubscription.findMany({
      where: {
        userId: user.userId,
        status: { not: 'CANCELED' },
      },
      orderBy: { createdAt: 'desc' },
    })
    return c.json({ services })
  } catch (error) {
    console.error('Failed to fetch user services:', error)
    return c.json({ error: 'Failed to fetch services' }, 500)
  }
})

// POST /api/v1/services/cancel - JWT auth
app.post('/api/v1/services/cancel', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const { stripeSubscriptionId } = await c.req.json()

    if (!stripeSubscriptionId) {
      return c.json({ error: 'Missing stripeSubscriptionId' }, 400)
    }

    // Verify the service subscription belongs to this user
    const service = await prisma.serviceSubscription.findFirst({
      where: {
        userId: user.userId,
        stripeSubscriptionId,
      },
    })

    if (!service) {
      return c.json({ error: 'Service subscription not found or does not belong to user' }, 404)
    }

    // Tell Stripe to cancel at period end
    if (service.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.update(service.stripeSubscriptionId, {
          cancel_at_period_end: true,
        })
      } catch (err: unknown) {
        const stripeErr = err as { code?: string }
        if (stripeErr.code === 'resource_missing') {
          console.warn(`Stripe subscription ${service.stripeSubscriptionId} not found, proceeding with DB update`)
        } else {
          throw err
        }
      }
    }

    // Set canceledAt — user retains access until period ends
    await prisma.serviceSubscription.update({
      where: { id: service.id },
      data: { canceledAt: new Date() },
    })

    return c.json({ success: true })
  } catch (error) {
    console.error('Failed to cancel service subscription:', error)
    return c.json({ error: 'Failed to cancel service subscription' }, 500)
  }
})

export default app
