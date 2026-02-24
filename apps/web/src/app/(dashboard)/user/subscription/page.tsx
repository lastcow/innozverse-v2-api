import { auth } from '@/auth'
import SubscriptionClient from './subscription-client'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default async function SubscriptionPage() {
  // Fetch plans from API (public endpoint)
  const plansRes = await fetch(`${apiUrl}/api/v1/subscriptions/plans`, {
    cache: 'no-store',
  })
  const plansData = plansRes.ok ? await plansRes.json() : { plans: [] }

  // Fetch user subscription from API (authenticated)
  let subscription = null
  const session = await auth()
  if (session?.accessToken) {
    const subRes = await fetch(`${apiUrl}/api/v1/subscriptions/me`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: 'no-store',
    })
    if (subRes.ok) {
      const subData = await subRes.json()
      subscription = subData.subscription
    }
  }

  return <SubscriptionClient plans={plansData.plans} currentSubscription={subscription} />
}
