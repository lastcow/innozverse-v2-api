'use server'

import { auth } from '@/auth'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function cancelServiceSubscription(
  stripeSubscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id || !session.accessToken) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const res = await fetch(`${apiUrl}/api/v1/services/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({ stripeSubscriptionId }),
    })

    if (!res.ok) {
      const data = await res.json()
      return { success: false, error: data.error || 'Failed to cancel service' }
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to cancel service subscription:', error)
    return { success: false, error: 'Failed to cancel service' }
  }
}
