'use server'

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
