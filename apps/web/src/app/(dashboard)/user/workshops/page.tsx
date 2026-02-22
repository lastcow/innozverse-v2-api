import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { MyWorkshops } from '@/components/dashboard/my-workshops'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default async function UserWorkshopsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const res = await fetch(`${apiUrl}/api/v1/workshops/my-registrations`, {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  })

  const { workshops } = await res.json()

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#202224] mb-2">My Workshops</h1>
      <p className="text-gray-500 mb-8">
        Manage your workshop registrations.
      </p>
      <MyWorkshops workshops={workshops} />
    </div>
  )
}
