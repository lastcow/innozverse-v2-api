import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, CalendarDays, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { RegistrationList } from './registration-list'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

function getStatus(workshop: { isPublished: boolean; startDate: string; endDate: string }) {
  const now = new Date()
  if (!workshop.isPublished) return { label: 'Draft', color: 'bg-gray-50 text-gray-600 border-0' }
  if (now < new Date(workshop.startDate)) return { label: 'Upcoming', color: 'bg-blue-50 text-blue-600 border-0' }
  if (now > new Date(workshop.endDate)) return { label: 'Past', color: 'bg-gray-50 text-gray-400 border-0' }
  return { label: 'Active', color: 'bg-green-50 text-green-600 border-0' }
}

export default async function AdminWorkshopDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const res = await fetch(`${apiUrl}/api/v1/workshops/${params.id}/registrations`, {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  })

  if (!res.ok) {
    if (res.status === 403) redirect('/user/dashboard')
    notFound()
  }

  const { workshop } = await res.json()

  const images = Array.isArray(workshop.imageUrls) ? (workshop.imageUrls as string[]) : []
  const status = getStatus(workshop)
  const totalSeats = workshop.registrations.reduce((sum: number, r: { seats?: number }) => sum + (r.seats ?? 1), 0)

  return (
    <div className="space-y-6">
      <Link
        href="/admin/workshops"
        className="inline-flex items-center gap-2 text-[#4379EE] hover:text-[#3568d4] font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Workshops
      </Link>

      {/* Workshop Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="sm:flex gap-6">
          {images[0] ? (
            <div className="relative sm:w-40 h-32 sm:h-auto rounded-xl overflow-hidden flex-shrink-0">
              <Image
                src={images[0]}
                alt={workshop.title}
                fill
                className="object-cover"
                sizes="160px"
              />
            </div>
          ) : (
            <div className="sm:w-40 h-32 sm:h-auto rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0">
              <CalendarDays className="w-10 h-10 text-[#4379EE]/30" />
            </div>
          )}
          <div className="flex-1 min-w-0 mt-4 sm:mt-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-[#202224]">{workshop.title}</h1>
              <Badge className={status.color}>{status.label}</Badge>
            </div>
            <p className="text-gray-500 text-sm mb-4 line-clamp-2">{workshop.description}</p>
            <div className="flex flex-wrap gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-gray-400" />
                {formatDate(workshop.startDate)} – {formatDate(workshop.endDate)}
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                {totalSeats} / {workshop.capacity || '\u221e'} seats booked
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registered People */}
      <RegistrationList
        registrations={workshop.registrations}
        workshopCapacity={workshop.capacity}
      />
    </div>
  )
}
