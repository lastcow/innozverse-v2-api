import { Hono } from 'hono'
import { prisma } from '@repo/database'
import { authMiddleware, requireRole } from '../middleware/auth'
import type { AuthContext } from '../types'

const app = new Hono<{ Variables: AuthContext }>()

// GET /api/v1/subscriptions/plans - Public, no auth
// Pass ?all=true to include inactive plans (for admin)
app.get('/api/v1/subscriptions/plans', async (c) => {
  try {
    const showAll = c.req.query('all') === 'true'
    const plans = await prisma.plan.findMany({
      where: showAll ? {} : { active: true },
      orderBy: { sortOrder: 'asc' },
    })
    return c.json({ plans })
  } catch (error) {
    console.error('Failed to fetch plans:', error)
    return c.json({ error: 'Failed to fetch plans' }, 500)
  }
})

// POST /api/v1/subscriptions/from-stripe - Internal webhook secret auth
app.post('/api/v1/subscriptions/from-stripe', async (c) => {
  const internalSecret = c.req.header('X-Internal-Secret')
  const expectedSecret = process.env.INTERNAL_WEBHOOK_SECRET

  if (!expectedSecret || internalSecret !== expectedSecret) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const body = await c.req.json()
    const {
      userId,
      planName,
      stripeSubscriptionId,
      stripeCustomerId,
      status,
      billingPeriod,
      currentPeriodStart,
      currentPeriodEnd,
    } = body

    if (!userId || !planName) {
      return c.json({ error: 'Missing required fields: userId and planName' }, 400)
    }

    // Verify user exists before creating subscription
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (!user) {
      console.error(`Subscription: user not found for userId=${userId}`)
      return c.json({ error: `User not found: ${userId}` }, 404)
    }

    // Look up Plan by name
    const plan = await prisma.plan.findUnique({ where: { name: planName } })
    if (!plan) {
      return c.json({ error: `Plan not found: ${planName}` }, 404)
    }

    // Upsert UserSubscription by userId (one subscription per user)
    const subscription = await prisma.userSubscription.upsert({
      where: { userId },
      update: {
        planId: plan.id,
        stripeSubscriptionId: stripeSubscriptionId ?? undefined,
        stripeCustomerId: stripeCustomerId ?? undefined,
        status: status ?? 'ACTIVE',
        billingPeriod: billingPeriod ?? 'monthly',
        currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart) : undefined,
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : undefined,
        canceledAt: status === 'CANCELED' ? new Date() : null,
      },
      create: {
        userId,
        planId: plan.id,
        stripeSubscriptionId: stripeSubscriptionId ?? null,
        stripeCustomerId: stripeCustomerId ?? null,
        status: status ?? 'ACTIVE',
        billingPeriod: billingPeriod ?? 'monthly',
        currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart) : null,
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : null,
      },
    })

    return c.json({ subscription })
  } catch (error) {
    console.error('Failed to create/update subscription:', error)
    const message = error instanceof Error ? error.message : 'Failed to process subscription'
    return c.json({ error: message }, 500)
  }
})

// POST /api/v1/subscriptions/cancel - JWT auth
app.post('/api/v1/subscriptions/cancel', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const { stripeSubscriptionId } = await c.req.json()

    if (!stripeSubscriptionId) {
      return c.json({ error: 'Missing stripeSubscriptionId' }, 400)
    }

    // Verify the subscription belongs to this user
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId: user.userId },
    })

    if (!subscription || subscription.stripeSubscriptionId !== stripeSubscriptionId) {
      return c.json({ error: 'Subscription not found or does not belong to user' }, 404)
    }

    // Keep status ACTIVE — user retains access until period ends.
    // Set canceledAt to indicate pending cancellation.
    // Stripe will fire customer.subscription.deleted at period end,
    // which the webhook handler will use to set status to CANCELED.
    await prisma.userSubscription.update({
      where: { userId: user.userId },
      data: {
        canceledAt: new Date(),
      },
    })

    return c.json({ success: true })
  } catch (error) {
    console.error('Failed to cancel subscription:', error)
    return c.json({ error: 'Failed to cancel subscription' }, 500)
  }
})

// GET /api/v1/subscriptions/me - JWT auth
app.get('/api/v1/subscriptions/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId: user.userId },
      include: { plan: true },
    })
    return c.json({ subscription })
  } catch (error) {
    console.error('Failed to fetch user subscription:', error)
    return c.json({ error: 'Failed to fetch subscription' }, 500)
  }
})

// PUT /api/v1/subscriptions/plans/:id - Update plan (admin only)
app.put('/api/v1/subscriptions/plans/:id', authMiddleware, requireRole(['ADMIN']), async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const plan = await prisma.plan.update({
      where: { id },
      data: { ...body },
    })
    return c.json({ plan })
  } catch (error) {
    console.error('Failed to update plan:', error)
    return c.json({ error: 'Failed to update plan' }, 500)
  }
})

// POST /api/v1/subscriptions/plans - Create plan (admin only)
app.post('/api/v1/subscriptions/plans', authMiddleware, requireRole(['ADMIN']), async (c) => {
  try {
    const body = await c.req.json()
    const plan = await prisma.plan.create({
      data: { ...body },
    })
    return c.json({ plan })
  } catch (error) {
    console.error('Failed to create plan:', error)
    return c.json({ error: 'Failed to create plan' }, 500)
  }
})

// DELETE /api/v1/subscriptions/plans/:id - Delete plan (admin only)
app.delete('/api/v1/subscriptions/plans/:id', authMiddleware, requireRole(['ADMIN']), async (c) => {
  try {
    const id = c.req.param('id')
    const activeCount = await prisma.userSubscription.count({
      where: { planId: id, status: { not: 'CANCELED' } },
    })
    if (activeCount > 0) {
      return c.json({ error: 'Cannot delete plan with active subscriptions' }, 400)
    }
    await prisma.plan.delete({ where: { id } })
    return c.json({ success: true })
  } catch (error) {
    console.error('Failed to delete plan:', error)
    return c.json({ error: 'Failed to delete plan' }, 500)
  }
})

export default app
