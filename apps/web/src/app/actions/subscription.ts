'use server'

import Stripe from 'stripe'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
  })
}

export interface UserSubscription {
  planId: string
  planName: string
  billingPeriod: 'monthly' | 'annual'
  currentPeriodStart: string
  currentPeriodEnd: string
  status: string
  stripeSubscriptionId: string
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * Fetch the user's active Stripe subscription.
 * Returns null if no active subscription is found.
 */
export async function fetchUserSubscription(
  userId: string,
  accessToken: string
): Promise<UserSubscription | null> {
  try {
    // Get user's Stripe customer ID from API
    const userRes = await fetch(`${apiUrl}/api/v1/users/${userId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!userRes.ok) return null

    const userData = await userRes.json()
    const customerId = userData.user?.stripeCustomerId
    if (!customerId) return null

    const stripe = getStripe()
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    })

    const sub = subscriptions.data[0]
    if (!sub) return null

    const planId = sub.metadata.planId ?? ''
    const billingPeriod = (sub.metadata.billingPeriod as 'monthly' | 'annual') ?? 'monthly'

    // Extract plan name from planId (e.g. "plan-pro-monthly" -> "Pro")
    const namePart = planId.replace(/^plan-/, '').replace(/-(monthly|annual)$/, '')

    return {
      planId,
      planName: namePart.charAt(0).toUpperCase() + namePart.slice(1),
      billingPeriod,
      currentPeriodStart: new Date(((sub as any).current_period_start ?? sub.start_date) * 1000).toISOString(),
      currentPeriodEnd: new Date(((sub as any).current_period_end ?? sub.start_date) * 1000).toISOString(),
      status: sub.status,
      stripeSubscriptionId: sub.id,
    }
  } catch (err) {
    console.error('Failed to fetch user subscription:', err)
    return null
  }
}
