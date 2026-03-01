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
 * Activate the Free plan for the current user.
 * Calls the internal from-stripe endpoint (which handles null Stripe fields)
 * to create the subscription and trigger VM provisioning.
 */
export async function activateFreeSubscription(): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id || !session.accessToken) {
    return { success: false, error: 'Unauthorized' }
  }

  const internalSecret = process.env.INTERNAL_WEBHOOK_SECRET
  if (!internalSecret) {
    console.error('INTERNAL_WEBHOOK_SECRET not configured')
    return { success: false, error: 'Server configuration error' }
  }

  try {
    const res = await fetch(`${apiUrl}/api/v1/subscriptions/from-stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': internalSecret,
      },
      body: JSON.stringify({
        userId: session.user.id,
        planName: 'Free',
        status: 'ACTIVE',
        billingPeriod: 'monthly',
        provision: true,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      return { success: false, error: data.error || 'Failed to activate free plan' }
    }

    const { revalidatePath } = await import('next/cache')
    revalidatePath('/user/subscription')

    return { success: true }
  } catch (err) {
    console.error('Failed to activate free plan:', err)
    return { success: false, error: 'Failed to activate free plan' }
  }
}

/**
 * Change an existing paid subscription to a different paid plan.
 * Uses stripe.subscriptions.update() — no checkout needed since
 * the customer already has a payment method on file.
 */
export async function changeSubscription(
  stripeSubscriptionId: string,
  newPlanName: string,
  newPlanPrice: number,
  billingPeriod: 'monthly' | 'annual',
  direction: 'upgrade' | 'downgrade'
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id || !session.accessToken) {
    return { success: false, error: 'Unauthorized' }
  }

  const internalSecret = process.env.INTERNAL_WEBHOOK_SECRET
  if (!internalSecret) {
    console.error('INTERNAL_WEBHOOK_SECRET not configured')
    return { success: false, error: 'Server configuration error' }
  }

  try {
    const stripe = getStripe()

    // Retrieve the current subscription to get the subscription item ID
    const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId)
    const itemId = sub.items.data[0]?.id
    if (!itemId) {
      return { success: false, error: 'No subscription item found' }
    }

    // Create a new Price object (existing flow uses inline price_data, no stored Price IDs)
    const newPrice = await stripe.prices.create({
      currency: 'usd',
      unit_amount: Math.round(newPlanPrice * 100),
      tax_behavior: 'exclusive',
      recurring: { interval: billingPeriod === 'annual' ? 'year' : 'month' },
      product_data: { name: `${newPlanName} Plan (${billingPeriod === 'annual' ? 'Annual' : 'Monthly'})` },
    })

    // Update the subscription in-place
    await stripe.subscriptions.update(stripeSubscriptionId, {
      items: [{ id: itemId, price: newPrice.id }],
      proration_behavior: direction === 'upgrade' ? 'always_invoice' : 'create_prorations',
      metadata: {
        planId: `plan-${newPlanName.toLowerCase()}-${billingPeriod}`,
        billingPeriod,
        userId: session.user.id,
      },
    })

    // Trigger VM reprovisioning (destroy old VMs, provision new ones)
    try {
      const reprovisionRes = await fetch(`${apiUrl}/api/v1/subscriptions/reprovision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Secret': internalSecret,
        },
        body: JSON.stringify({
          userId: session.user.id,
          newPlanName,
        }),
      })
      if (!reprovisionRes.ok) {
        const body = await reprovisionRes.json().catch(() => ({}))
        console.error('VM reprovisioning failed:', reprovisionRes.status, body)
        return { success: true, error: `Plan updated but VM reprovisioning failed: ${body.error || reprovisionRes.status}` }
      }
    } catch (err) {
      console.error('VM reprovisioning request failed:', err)
      return { success: true, error: 'Plan updated but could not reach reprovisioning service' }
    }

    const { revalidatePath } = await import('next/cache')
    revalidatePath('/user/subscription')

    return { success: true }
  } catch (err) {
    console.error('Failed to change subscription:', err)
    const message = err instanceof Error ? err.message : 'Failed to change subscription'
    return { success: false, error: message }
  }
}

/**
 * Cancel the user's subscription at end of current billing period.
 * Sets cancel_at_period_end in Stripe so the user retains access
 * until the paid period ends, then Stripe stops renewal automatically.
 */
export async function cancelSubscription(
  stripeSubscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id || !session.accessToken) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const stripe = getStripe()
    try {
      const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId)

      if (sub.status !== 'canceled') {
        await stripe.subscriptions.update(stripeSubscriptionId, {
          cancel_at_period_end: true,
        })
      }
    } catch (stripeErr: any) {
      console.error('Stripe cancel error:', stripeErr?.code, stripeErr?.message)
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
