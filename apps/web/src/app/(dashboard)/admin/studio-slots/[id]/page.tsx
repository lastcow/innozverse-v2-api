import { prisma } from '@repo/database'
import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Users, Mail } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

const formatTime = (date: Date) =>
  date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

const formatDateTime = (date: Date) =>
  date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

function getStatus(slot: { isAvailable: boolean; startTime: Date; endTime: Date }, confirmedCount: number, capacity: number) {
  const now = new Date()
  if (!slot.isAvailable) return { label: 'Disabled', color: 'bg-gray-50 text-gray-600 border-0' }
  if (now > slot.endTime) return { label: 'Past', color: 'bg-gray-50 text-gray-400 border-0' }
  if (now >= slot.startTime && now <= slot.endTime) return { label: 'Active', color: 'bg-green-50 text-green-600 border-0' }
  if (confirmedCount >= capacity) return { label: 'Full', color: 'bg-orange-50 text-orange-600 border-0' }
  return { label: 'Open', color: 'bg-blue-50 text-blue-600 border-0' }
}

const bookingStatusColors: Record<string, string> = {
  CONFIRMED: 'bg-green-50 text-green-600 border-0',
  CANCELLED: 'bg-red-50 text-red-500 border-0',
}

export default async function AdminStudioSlotDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SYSTEM')) redirect('/user/dashboard')

  const slot = await prisma.studioSlot.findUnique({
    where: { id: params.id },
    include: {
      bookings: {
        include: {
          user: {
            select: { id: true, email: true, fname: true, lname: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!slot) notFound()

  const confirmedBookings = slot.bookings.filter((b) => b.status === 'CONFIRMED')
  const cancelledBookings = slot.bookings.filter((b) => b.status === 'CANCELLED')
  const status = getStatus(slot, confirmedBookings.length, slot.capacity)

  return (
    <div className="space-y-6">
      <Link
        href="/admin/studio-slots"
        className="inline-flex items-center gap-2 text-[#4379EE] hover:text-[#3568d4] font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Studio Slots
      </Link>

      {/* Slot Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Clock className="w-7 h-7 text-[#4379EE]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-[#202224]">
                {formatDate(slot.startTime)}
              </h1>
              <Badge className={status.color}>{status.label}</Badge>
            </div>
            <p className="text-[#4379EE] font-medium mb-4">
              {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
            </p>
            <div className="flex flex-wrap gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                {confirmedBookings.length} / {slot.capacity} booked
              </div>
              {cancelledBookings.length > 0 && (
                <span className="text-gray-400">
                  {cancelledBookings.length} cancelled
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmed Bookings */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-[#4379EE]" />
          <h2 className="text-lg font-semibold text-[#202224]">
            Confirmed Bookings ({confirmedBookings.length})
          </h2>
        </div>

        {confirmedBookings.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No confirmed bookings</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {confirmedBookings.map((booking, i) => {
              const name =
                [booking.user.fname, booking.user.lname].filter(Boolean).join(' ') || null
              return (
                <div key={booking.id} className="flex items-center gap-4 py-3">
                  <span className="text-xs text-gray-400 w-6 text-right">{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-[#4379EE] flex items-center justify-center text-white text-xs font-medium shrink-0">
                    {booking.user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#202224] truncate">
                      {name || booking.user.email}
                    </p>
                    {name && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3" />
                        {booking.user.email}
                      </p>
                    )}
                  </div>
                  <Badge className={bookingStatusColors['CONFIRMED']}>Confirmed</Badge>
                  <span className="text-xs text-gray-400 shrink-0">
                    {formatDateTime(booking.createdAt)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Cancelled Bookings */}
      {cancelledBookings.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-[#202224]">
              Cancelled ({cancelledBookings.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {cancelledBookings.map((booking) => {
              const name =
                [booking.user.fname, booking.user.lname].filter(Boolean).join(' ') || null
              return (
                <div key={booking.id} className="flex items-center gap-4 py-3 opacity-60">
                  <span className="text-xs text-gray-400 w-6" />
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs font-medium shrink-0">
                    {booking.user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#202224] truncate">
                      {name || booking.user.email}
                    </p>
                    {name && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3" />
                        {booking.user.email}
                      </p>
                    )}
                  </div>
                  <Badge className={bookingStatusColors['CANCELLED']}>Cancelled</Badge>
                  <span className="text-xs text-gray-400 shrink-0">
                    {formatDateTime(booking.createdAt)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
