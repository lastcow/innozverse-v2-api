'use server'

import Stripe from 'stripe'
import { auth } from '@/auth'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
  })
}

export interface UserSubscription {
  planId: string
  planName: string
  billingPeriod: 'monthly' | 'annual'
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  status: string
  stripeSubscriptionId: string | null
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * Fetch the user's active subscription from the API.
 * Returns null if no active subscription is found.
 */
export async function fetchUserSubscription(
  userId: string,
  accessToken: string
): Promise<UserSubscription | null> {
  try {
    const res = await fetch(`${apiUrl}/api/v1/subscriptions/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) return null

    const data = await res.json()
    const sub = data.subscription
    if (!sub) return null

    return {
      planId: sub.plan?.name?.toLowerCase() ? `plan-${sub.plan.name.toLowerCase()}-${sub.billingPeriod}` : sub.planId,
      planName: sub.plan?.name ?? '',
      billingPeriod: sub.billingPeriod as 'monthly' | 'annual',
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      status: sub.status,
      stripeSubscriptionId: sub.stripeSubscriptionId,
    }
  } catch (err) {
    console.error('Failed to fetch user subscription:', err)
    return null
  }
}

/**
 * Cancel the user's active Stripe subscription.
 * Cancels immediately in Stripe and updates DB status via the API.
 */
export async function cancelSubscription(
  stripeSubscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id || !session.accessToken) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    // Cancel in Stripe
    const stripe = getStripe()
    try {
      // First verify the subscription exists
      const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId)
      console.log('Stripe subscription found:', sub.id, 'status:', sub.status)

      if (sub.status !== 'canceled') {
        await stripe.subscriptions.cancel(stripeSubscriptionId)
      }
    } catch (stripeErr: any) {
      console.error('Stripe cancel error:', stripeErr?.code, stripeErr?.message)
      // resource_missing = already canceled or doesn't exist — still update DB
      if (stripeErr?.code !== 'resource_missing') {
        throw stripeErr
      }
    }

    // Update DB status via API
    const res = await fetch(`${apiUrl}/api/v1/subscriptions/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({ stripeSubscriptionId }),
    })

    if (!res.ok) {
      const data = await res.json()
      return { success: false, error: data.error || 'Failed to update subscription' }
    }

    return { success: true }
  } catch (err) {
    console.error('Failed to cancel subscription:', err)
    return { success: false, error: 'Failed to cancel subscription' }
  }
}
