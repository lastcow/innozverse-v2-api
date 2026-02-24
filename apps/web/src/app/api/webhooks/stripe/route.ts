import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
  })
}

function getApiConfig() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  const internalSecret = process.env.INTERNAL_WEBHOOK_SECRET
  return { apiUrl, internalSecret }
}

async function forwardToApi(
  path: string,
  payload: Record<string, unknown>,
  internalSecret: string,
  apiUrl: string
): Promise<{ ok: boolean; status?: number; body?: string }> {
  try {
    const res = await fetch(`${apiUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': internalSecret,
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const body = await res.text()
      return { ok: false, status: res.status, body }
    }
    return { ok: true }
  } catch (err) {
    console.error(`Failed to forward to API ${path}:`, err)
    return { ok: false, body: String(err) }
  }
}

async function handleSubscriptionCheckout(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId

  if (!userId) {
    console.error('CRITICAL: Missing userId in subscription checkout metadata:', session.id)
    return NextResponse.json({ received: true })
  }

  const { apiUrl, internalSecret } = getApiConfig()

  if (!internalSecret) {
    console.error('INTERNAL_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const stripe = getStripe()

  // Retrieve the full subscription object
  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id
  if (!subscriptionId) {
    console.error('CRITICAL: No subscription ID on checkout session:', session.id)
    return NextResponse.json({ received: true })
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  // Parse plan name from metadata planId (e.g. "plan-basic-monthly" → "Basic")
  const rawPlanId = subscription.metadata?.planId ?? session.metadata?.planId ?? ''
  const namePart = rawPlanId.replace(/^plan-/, '').replace(/-(monthly|annual)$/, '')
  const planName = namePart.charAt(0).toUpperCase() + namePart.slice(1)

  const billingPeriod = subscription.metadata?.billingPeriod ?? session.metadata?.billingPeriod ?? 'monthly'

  // In newer Stripe API versions, period dates are on subscription items
  const subAny = subscription as any
  const firstItem = subAny.items?.data?.[0]
  const rawStart = subAny.current_period_start ?? firstItem?.current_period_start ?? null
  const rawEnd = subAny.current_period_end ?? firstItem?.current_period_end ?? null
  const currentPeriodStart = rawStart
    ? new Date(rawStart * 1000).toISOString()
    : null
  const currentPeriodEnd = rawEnd
    ? new Date(rawEnd * 1000).toISOString()
    : null

  const stripeCustomerId =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id ?? null

  const result = await forwardToApi(
    '/api/v1/subscriptions/from-stripe',
    {
      userId,
      planName,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId,
      status: 'ACTIVE',
      billingPeriod,
      currentPeriodStart,
      currentPeriodEnd,
    },
    internalSecret,
    apiUrl
  )

  if (!result.ok) {
    console.error('API subscription creation failed:', result.status, result.body)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  if (!userId) {
    console.error('CRITICAL: Missing userId in subscription metadata:', subscription.id)
    return NextResponse.json({ received: true })
  }

  const { apiUrl, internalSecret } = getApiConfig()
  if (!internalSecret) {
    console.error('INTERNAL_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const rawPlanId = subscription.metadata?.planId ?? ''
  const namePart = rawPlanId.replace(/^plan-/, '').replace(/-(monthly|annual)$/, '')
  const planName = namePart.charAt(0).toUpperCase() + namePart.slice(1)
  const billingPeriod = subscription.metadata?.billingPeriod ?? 'monthly'

  const statusMap: Record<string, string> = {
    active: 'ACTIVE',
    past_due: 'PAST_DUE',
    canceled: 'CANCELED',
    incomplete: 'INCOMPLETE',
    trialing: 'TRIALING',
  }

  const subAny = subscription as any
  const firstItem = subAny.items?.data?.[0]
  const rawStart = subAny.current_period_start ?? firstItem?.current_period_start ?? null
  const rawEnd = subAny.current_period_end ?? firstItem?.current_period_end ?? null
  const currentPeriodStart = rawStart
    ? new Date(rawStart * 1000).toISOString()
    : null
  const currentPeriodEnd = rawEnd
    ? new Date(rawEnd * 1000).toISOString()
    : null

  const stripeCustomerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : (subscription.customer as any)?.id ?? null

  const result = await forwardToApi(
    '/api/v1/subscriptions/from-stripe',
    {
      userId,
      planName,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId,
      status: statusMap[subscription.status] ?? 'ACTIVE',
      billingPeriod,
      currentPeriodStart,
      currentPeriodEnd,
    },
    internalSecret,
    apiUrl
  )

  if (!result.ok) {
    console.error('API subscription update failed:', result.status, result.body)
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Branch: subscription checkouts go to a different handler
  if (session.mode === 'subscription') {
    return handleSubscriptionCheckout(session)
  }

  const userId = session.metadata?.userId
  const itemsJson = session.metadata?.items

  if (!userId) {
    console.error('CRITICAL: Missing userId in checkout session metadata:', session.id)
    return NextResponse.json({ received: true })
  }

  if (!itemsJson) {
    console.error('CRITICAL: Missing items in checkout session metadata:', session.id)
    return NextResponse.json({ received: true })
  }

  const { apiUrl, internalSecret } = getApiConfig()

  if (!internalSecret) {
    console.error('INTERNAL_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const items = JSON.parse(itemsJson)

  const result = await forwardToApi(
    '/api/v1/orders/from-stripe',
    {
      userId,
      stripeSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id ?? null,
      amountTotal: session.amount_total,
      status: 'success',
      items,
    },
    internalSecret,
    apiUrl
  )

  if (!result.ok) {
    console.error('API order creation failed:', result.status, result.body)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handlePaymentFailed(
  sessionOrIntent: Stripe.Checkout.Session | Stripe.PaymentIntent,
  eventType: string
) {
  const userId = sessionOrIntent.metadata?.userId

  if (!userId) {
    console.error(`CRITICAL: Missing userId in ${eventType} metadata:`, sessionOrIntent.id)
    return NextResponse.json({ received: true })
  }

  const { apiUrl, internalSecret } = getApiConfig()

  if (!internalSecret) {
    console.error('INTERNAL_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  let stripeSessionId: string | null = null
  let stripePaymentIntentId: string | null = null

  if (eventType === 'checkout.session.async_payment_failed') {
    const session = sessionOrIntent as Stripe.Checkout.Session
    stripeSessionId = session.id
    stripePaymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id ?? null
  } else {
    const intent = sessionOrIntent as Stripe.PaymentIntent
    stripePaymentIntentId = intent.id
  }

  const result = await forwardToApi(
    '/api/v1/orders/payment-failed',
    {
      userId,
      stripeSessionId,
      stripePaymentIntentId,
      eventType,
    },
    internalSecret,
    apiUrl
  )

  if (!result.ok) {
    console.error('API payment-failed notification failed:', result.status, result.body)
  }

  return NextResponse.json({ received: true })
}

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      return handleCheckoutCompleted(session)
    }

    case 'checkout.session.async_payment_failed': {
      const session = event.data.object as Stripe.Checkout.Session
      return handlePaymentFailed(session, event.type)
    }

    case 'payment_intent.payment_failed': {
      const intent = event.data.object as Stripe.PaymentIntent
      return handlePaymentFailed(intent, event.type)
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      return handleSubscriptionUpdated(subscription)
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const subDetails = (invoice as any).parent?.subscription_details
      if (!subDetails?.subscription) break

      const userId = subDetails.metadata?.userId
      if (!userId) {
        console.error('CRITICAL: Missing userId in invoice subscription metadata:', invoice.id)
        break
      }

      const { apiUrl, internalSecret } = getApiConfig()
      if (!internalSecret) {
        console.error('INTERNAL_WEBHOOK_SECRET not configured')
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
      }

      const rawPlanId = subDetails.metadata?.planId ?? ''
      const namePart = rawPlanId.replace(/^plan-/, '').replace(/-(monthly|annual)$/, '')
      const planName = namePart.charAt(0).toUpperCase() + namePart.slice(1)
      const billingPeriod = subDetails.metadata?.billingPeriod ?? 'monthly'

      // Period dates from the first line item
      const lineItem = (invoice as any).lines?.data?.[0]
      const periodStart = lineItem?.period?.start
        ? new Date(lineItem.period.start * 1000).toISOString()
        : null
      const periodEnd = lineItem?.period?.end
        ? new Date(lineItem.period.end * 1000).toISOString()
        : null

      const stripeCustomerId =
        typeof invoice.customer === 'string'
          ? invoice.customer
          : (invoice.customer as any)?.id ?? null

      await forwardToApi(
        '/api/v1/subscriptions/from-stripe',
        {
          userId,
          planName,
          stripeSubscriptionId: subDetails.subscription,
          stripeCustomerId,
          status: 'ACTIVE',
          billingPeriod,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
        internalSecret,
        apiUrl
      )

      return NextResponse.json({ received: true })
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      // Treat deletion as cancellation
      const userId = subscription.metadata?.userId
      if (userId) {
        const { apiUrl, internalSecret } = getApiConfig()
        if (internalSecret) {
          const rawPlanId = subscription.metadata?.planId ?? ''
          const namePart = rawPlanId.replace(/^plan-/, '').replace(/-(monthly|annual)$/, '')
          const planName = namePart.charAt(0).toUpperCase() + namePart.slice(1)

          await forwardToApi(
            '/api/v1/subscriptions/from-stripe',
            {
              userId,
              planName,
              stripeSubscriptionId: subscription.id,
              status: 'CANCELED',
              billingPeriod: subscription.metadata?.billingPeriod ?? 'monthly',
            },
            internalSecret,
            apiUrl
          )
        }
      }
      return NextResponse.json({ received: true })
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}
