import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
  })
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId)

    return NextResponse.json({
      status: session.status,
      paymentStatus: session.payment_status,
    })
  } catch (err) {
    console.error('Failed to retrieve checkout session:', err)
    return NextResponse.json(
      { error: 'Failed to retrieve session status' },
      { status: 500 }
    )
  }
}
