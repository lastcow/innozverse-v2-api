import { auth } from '@/auth'
import ServicesClient from './services-client'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default async function ServicesPage() {
  let services: any[] = []
  const session = await auth()

  if (session?.accessToken) {
    const res = await fetch(`${apiUrl}/api/v1/services/me`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      services = data.services ?? []
    }
  }

  return <ServicesClient services={services} />
}
