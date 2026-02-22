import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { MyStudioBookings } from '@/components/dashboard/my-studio-bookings'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default async function UserStudioBookingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const res = await fetch(`${apiUrl}/api/v1/studio-bookings/mine`, {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  })

  const { bookings } = await res.json()

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#202224] mb-2">Studio Bookings</h1>
      <p className="text-gray-500 mb-8">
        Manage your Open Studio session reservations.
      </p>
      <MyStudioBookings bookings={bookings} />
    </div>
  )
}
