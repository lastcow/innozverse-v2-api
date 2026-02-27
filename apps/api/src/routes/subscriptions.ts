import { Hono } from 'hono'
import Stripe from 'stripe'
import { prisma } from '@repo/database'
import { authMiddleware, requireRole } from '../middleware/auth'
import { provisionVmsForSubscription, destroyVmsForSubscription } from '../lib/vm-provisioner'
import type { AuthContext } from '../types'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

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

    // Check existing subscription before upsert (for provisioning logic)
    const existing = await prisma.userSubscription.findUnique({ where: { userId } })

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

    // Auto-provision VMs for new or reactivated subscriptions
    const resolvedStatus = status ?? 'ACTIVE'
    const isNewSubscription = !existing && resolvedStatus === 'ACTIVE'
    const isReactivation = existing?.status === 'CANCELED' && resolvedStatus === 'ACTIVE'

    if (isNewSubscription || isReactivation) {
      provisionVmsForSubscription(userId, subscription.id, plan.id)
        .catch(err => console.error('VM provisioning error:', err))
    }

    // Destroy linked VMs when subscription is canceled
    if (resolvedStatus === 'CANCELED') {
      destroyVmsForSubscription(subscription.id)
        .catch(err => console.error('VM destruction error:', err))
    }

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

// ============================================================
// Admin Subscription Management
// ============================================================

// GET /api/v1/admin/subscriptions - List subscriptions with stats
app.get('/api/v1/admin/subscriptions', authMiddleware, requireRole(['ADMIN']), async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '10')
    const planFilter = c.req.query('plan')
    const statusFilter = c.req.query('status')
    const billingFilter = c.req.query('billingPeriod')
    const search = c.req.query('search')

    const where: Record<string, unknown> = {}

    // Exclude CANCELED by default unless explicitly requested
    if (statusFilter && statusFilter !== 'ALL') {
      where.status = statusFilter
    } else if (!statusFilter) {
      where.status = { not: 'CANCELED' }
    }

    if (planFilter) {
      where.planId = planFilter
    }

    if (billingFilter) {
      where.billingPeriod = billingFilter
    }

    if (search) {
      where.user = {
        email: { contains: search, mode: 'insensitive' },
      }
    }

    const [subscriptions, total] = await Promise.all([
      prisma.userSubscription.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, fname: true, lname: true } },
          plan: { select: { id: true, name: true, monthlyPrice: true, annualTotalPrice: true, level: true, vmConfig: true } },
        },
        orderBy: { plan: { name: 'asc' } },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.userSubscription.count({ where }),
    ])

    // Stats (always exclude CANCELED)
    const allActive = await prisma.userSubscription.findMany({
      where: { status: { not: 'CANCELED' } },
      include: { plan: { select: { monthlyPrice: true, annualTotalPrice: true } } },
    })

    const totalActive = allActive.filter((s) => s.status === 'ACTIVE').length
    const totalPastDue = allActive.filter((s) => s.status === 'PAST_DUE').length

    // MRR: monthly subs * monthlyPrice + annual subs * (annualTotalPrice / 12)
    const mrr = allActive
      .filter((s) => s.status === 'ACTIVE')
      .reduce((sum, s) => {
        if (s.billingPeriod === 'annual') {
          return sum + (s.plan.annualTotalPrice / 12)
        }
        return sum + s.plan.monthlyPrice
      }, 0)

    // Group by plan
    const totalByPlan: Record<string, number> = {}
    for (const s of allActive) {
      totalByPlan[s.planId] = (totalByPlan[s.planId] || 0) + 1
    }

    // Group by status
    const totalByStatus: Record<string, number> = {}
    for (const s of allActive) {
      totalByStatus[s.status] = (totalByStatus[s.status] || 0) + 1
    }

    return c.json({
      subscriptions,
      stats: { totalActive, totalPastDue, totalSubscriptions: allActive.length, mrr, totalByPlan, totalByStatus },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Failed to fetch admin subscriptions:', error)
    return c.json({ error: 'Failed to fetch subscriptions' }, 500)
  }
})

// POST /api/v1/admin/subscriptions/:id/provision - Manually trigger VM provisioning
app.post('/api/v1/admin/subscriptions/:id/provision', authMiddleware, requireRole(['ADMIN']), async (c) => {
  try {
    const id = c.req.param('id')
    const subscription = await prisma.userSubscription.findUnique({ where: { id } })

    if (!subscription) {
      return c.json({ error: 'Subscription not found' }, 404)
    }

    if (subscription.status !== 'ACTIVE') {
      return c.json({ error: 'Subscription is not active' }, 400)
    }

    provisionVmsForSubscription(subscription.userId, subscription.id, subscription.planId)
      .catch(err => console.error('VM provisioning error:', err))

    return c.json({ success: true, message: 'VM provisioning started' })
  } catch (error) {
    console.error('Failed to trigger provisioning:', error)
    return c.json({ error: 'Failed to trigger provisioning' }, 500)
  }
})

// POST /api/v1/admin/subscriptions/:id/cancel - Cancel subscription at period end
app.post('/api/v1/admin/subscriptions/:id/cancel', authMiddleware, requireRole(['ADMIN']), async (c) => {
  try {
    const id = c.req.param('id')
    const subscription = await prisma.userSubscription.findUnique({ where: { id } })

    if (!subscription) {
      return c.json({ error: 'Subscription not found' }, 404)
    }

    if (subscription.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        })
      } catch (err: unknown) {
        const stripeErr = err as { code?: string; message?: string }
        if (stripeErr.code === 'resource_missing') {
          console.warn(`Stripe subscription ${subscription.stripeSubscriptionId} not found, proceeding with DB update`)
        } else {
          throw err
        }
      }
    }

    const updated = await prisma.userSubscription.update({
      where: { id },
      data: { canceledAt: new Date() },
      include: {
        user: { select: { id: true, email: true, fname: true, lname: true } },
        plan: { select: { id: true, name: true, monthlyPrice: true, annualTotalPrice: true, level: true, vmConfig: true } },
      },
    })

    return c.json({ subscription: updated })
  } catch (error) {
    console.error('Failed to cancel subscription:', error)
    return c.json({ error: 'Failed to cancel subscription' }, 500)
  }
})

// POST /api/v1/admin/subscriptions/:id/refund - Full or partial refund
app.post('/api/v1/admin/subscriptions/:id/refund', authMiddleware, requireRole(['ADMIN']), async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const amount = body.amount // optional, in dollars

    const subscription = await prisma.userSubscription.findUnique({ where: { id } })

    if (!subscription) {
      return c.json({ error: 'Subscription not found' }, 404)
    }

    if (!subscription.stripeSubscriptionId) {
      return c.json({ error: 'No Stripe subscription associated' }, 400)
    }

    // Get latest paid invoice with expanded payments
    const invoices = await stripe.invoices.list({
      subscription: subscription.stripeSubscriptionId,
      status: 'paid',
      limit: 1,
      expand: ['data.payments'],
    })

    if (!invoices.data.length) {
      return c.json({ error: 'No paid invoices found for this subscription' }, 404)
    }

    const invoice = invoices.data[0]! as unknown as Record<string, unknown>

    // In 2025+ API, payment info is in invoice.payments.data[]
    const payments = invoice.payments as { data: Array<{ payment: Record<string, unknown> }> } | undefined
    let paymentIntent: string | null = null
    let charge: string | null = null

    if (payments?.data?.length) {
      const payment = payments.data[0]!.payment
      if (payment.type === 'payment_intent') {
        const pi = payment.payment_intent
        paymentIntent = typeof pi === 'string' ? pi : (pi as Record<string, string>)?.id ?? null
      } else if (payment.type === 'charge') {
        const ch = payment.charge
        charge = typeof ch === 'string' ? ch : (ch as Record<string, string>)?.id ?? null
      }
    }

    // Fallback: legacy fields
    if (!paymentIntent && !charge) {
      paymentIntent = (invoice.payment_intent as string) || null
      charge = (invoice.charge as string) || null
    }

    if (!paymentIntent && !charge) {
      return c.json({ error: 'No payment found on invoice' }, 400)
    }

    const refundParams: Stripe.RefundCreateParams = paymentIntent
      ? { payment_intent: paymentIntent }
      : { charge: charge! }
    if (amount) {
      refundParams.amount = Math.round(amount * 100) // Convert dollars to cents
    }

    const refund = await stripe.refunds.create(refundParams)

    return c.json({
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status,
      },
    })
  } catch (error) {
    console.error('Failed to process refund:', error)
    const message = error instanceof Error ? error.message : 'Failed to process refund'
    return c.json({ error: message }, 500)
  }
})

export default app
