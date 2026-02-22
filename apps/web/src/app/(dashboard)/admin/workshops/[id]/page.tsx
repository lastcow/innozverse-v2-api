import { prisma } from '@repo/database'
import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, CalendarDays, Users, Mail } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

const formatDateTime = (date: Date) =>
  date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

function getStatus(workshop: { isPublished: boolean; startDate: Date; endDate: Date }) {
  const now = new Date()
  if (!workshop.isPublished) return { label: 'Draft', color: 'bg-gray-50 text-gray-600 border-0' }
  if (now < workshop.startDate) return { label: 'Upcoming', color: 'bg-blue-50 text-blue-600 border-0' }
  if (now > workshop.endDate) return { label: 'Past', color: 'bg-gray-50 text-gray-400 border-0' }
  return { label: 'Active', color: 'bg-green-50 text-green-600 border-0' }
}

export default async function AdminWorkshopDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SYSTEM')) redirect('/user/dashboard')

  const workshop = await prisma.workshop.findUnique({
    where: { id: params.id },
    include: {
      registrations: {
        include: {
          user: {
            select: { id: true, email: true, fname: true, lname: true, createdAt: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!workshop) notFound()

  const images = Array.isArray(workshop.imageUrls) ? (workshop.imageUrls as string[]) : []
  const status = getStatus(workshop)

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
                {workshop.registrations.length} / {workshop.capacity || '∞'} registered
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registered People */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-[#4379EE]" />
          <h2 className="text-lg font-semibold text-[#202224]">
            Registered Participants ({workshop.registrations.length})
          </h2>
        </div>

        {workshop.registrations.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No registrations yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {workshop.registrations.map((reg, i) => {
              const name =
                [reg.user.fname, reg.user.lname].filter(Boolean).join(' ') || null
              return (
                <div
                  key={reg.id}
                  className="flex items-center gap-4 py-3"
                >
                  <span className="text-xs text-gray-400 w-6 text-right">{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-[#4379EE] flex items-center justify-center text-white text-xs font-medium shrink-0">
                    {reg.user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#202224] truncate">
                      {name || reg.user.email}
                    </p>
                    {name && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3" />
                        {reg.user.email}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {formatDateTime(reg.createdAt)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
