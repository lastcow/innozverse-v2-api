import { prisma } from '@repo/database'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { MyWorkshops } from '@/components/dashboard/my-workshops'

export default async function UserWorkshopsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const registrations = await prisma.workshopRegistration.findMany({
    where: { userId: session.user.id },
    include: {
      workshop: {
        include: { _count: { select: { registrations: true } } },
      },
    },
    orderBy: { workshop: { startDate: 'asc' } },
  })

  const workshops = registrations.map((r) => ({
    registrationId: r.id,
    workshopId: r.workshop.id,
    title: r.workshop.title,
    description: r.workshop.description,
    imageUrls: r.workshop.imageUrls as string[],
    startDate: r.workshop.startDate.toISOString(),
    endDate: r.workshop.endDate.toISOString(),
    capacity: r.workshop.capacity,
    registered: r.workshop._count.registrations,
    registeredAt: r.createdAt.toISOString(),
  }))

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
