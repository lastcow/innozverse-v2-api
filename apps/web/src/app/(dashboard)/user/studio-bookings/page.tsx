import { prisma } from '@repo/database'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { MyStudioBookings } from '@/components/dashboard/my-studio-bookings'

export default async function UserStudioBookingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const bookings = await prisma.studioBooking.findMany({
    where: { userId: session.user.id },
    include: { slot: true },
    orderBy: { slot: { startTime: 'asc' } },
  })

  const data = bookings.map((b) => ({
    bookingId: b.id,
    slotId: b.slot.id,
    startTime: b.slot.startTime.toISOString(),
    endTime: b.slot.endTime.toISOString(),
    status: b.status,
    bookedAt: b.createdAt.toISOString(),
  }))

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#202224] mb-2">Studio Bookings</h1>
      <p className="text-gray-500 mb-8">
        Manage your Open Studio session reservations.
      </p>
      <MyStudioBookings bookings={data} />
    </div>
  )
}
