import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

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

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
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

    default:
      break
  }

  return NextResponse.json({ received: true })
}
