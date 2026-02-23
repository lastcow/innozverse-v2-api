import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
  })
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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const userId = session.metadata?.userId
    const itemsJson = session.metadata?.items

    if (!userId || !itemsJson) {
      console.error('Missing metadata in checkout session:', session.id)
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const items = JSON.parse(itemsJson)

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const internalSecret = process.env.INTERNAL_WEBHOOK_SECRET

    if (!internalSecret) {
      console.error('INTERNAL_WEBHOOK_SECRET not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    try {
      const res = await fetch(`${apiUrl}/api/v1/orders/from-stripe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Secret': internalSecret,
        },
        body: JSON.stringify({
          userId,
          stripeSessionId: session.id,
          stripePaymentIntentId:
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : session.payment_intent?.id ?? null,
          amountTotal: session.amount_total,
          items,
        }),
      })

      if (!res.ok) {
        const errorBody = await res.text()
        console.error('API order creation failed:', res.status, errorBody)
        return NextResponse.json(
          { error: 'Failed to create order' },
          { status: 500 }
        )
      }
    } catch (err) {
      console.error('Failed to forward to API:', err)
      return NextResponse.json(
        { error: 'Failed to forward to API' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ received: true })
}
