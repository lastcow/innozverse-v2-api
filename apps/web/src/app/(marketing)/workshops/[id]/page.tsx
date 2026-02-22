import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { CalendarDays, Users, ArrowLeft } from 'lucide-react'
import { RegisterButton } from '@/components/workshops/register-button'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

function formatDateRange(start: string, end: string) {
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }
  return `${new Date(start).toLocaleDateString('en-US', opts)} - ${new Date(end).toLocaleDateString('en-US', opts)}`
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default async function WorkshopDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  const isAuthenticated = !!session?.user?.id

  const headers: Record<string, string> = {}
  if (session?.accessToken) {
    headers['Authorization'] = `Bearer ${session.accessToken}`
  }

  const res = await fetch(`${apiUrl}/api/v1/workshops/${params.id}`, {
    cache: 'no-store',
    headers,
  })

  if (!res.ok) {
    notFound()
  }

  const { workshop, isRegistered } = await res.json()

  const images = Array.isArray(workshop.imageUrls)
    ? (workshop.imageUrls as string[])
    : []
  const now = new Date()
  const isPast = new Date(workshop.endDate) < now
  const isFull =
    workshop.capacity > 0 &&
    workshop._count.registrations >= workshop.capacity
  const registered = workshop._count.registrations
  const seatsText =
    workshop.capacity > 0
      ? `${registered} / ${workshop.capacity} Seats Taken`
      : 'Unlimited Seats'

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back Link */}
      <Link
        href="/workshops"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#4379EE] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Workshops
      </Link>

      {/* Hero Image */}
      {images[0] && (
        <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden mb-8">
          <Image
            src={images[0]}
            alt={workshop.title}
            fill
            className="object-cover"
            sizes="(max-width: 896px) 100vw, 896px"
            priority
          />
        </div>
      )}

      {/* Title & Meta */}
      <h1 className="text-3xl sm:text-4xl font-bold text-[#202224] mb-4">
        {workshop.title}
      </h1>

      <div className="flex flex-wrap items-center gap-4 text-sm mb-6">
        <span className="flex items-center gap-2 text-[#4379EE] font-medium">
          <CalendarDays className="w-4 h-4" />
          {formatDateRange(workshop.startDate, workshop.endDate)}
        </span>
        <span className="text-gray-400">
          {formatTime(workshop.startDate)} - {formatTime(workshop.endDate)}
        </span>
        <span className="flex items-center gap-1 text-gray-500">
          <Users className="w-4 h-4" />
          {seatsText}
        </span>
      </div>

      {/* Registration Button */}
      <div className="mb-8 max-w-xs">
        <RegisterButton
          workshopId={workshop.id}
          isAuthenticated={isAuthenticated}
          isRegistered={isRegistered}
          isFull={isFull}
          isPast={isPast}
        />
      </div>

      {/* Description */}
      <div className="prose prose-gray max-w-none mb-12">
        <p className="whitespace-pre-wrap text-gray-600 leading-relaxed">
          {workshop.description}
        </p>
      </div>

      {/* Image Gallery */}
      {images.length > 1 && (
        <div>
          <h2 className="text-xl font-bold text-[#202224] mb-4">Gallery</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {images.slice(1).map((url: string, i: number) => (
              <div
                key={url}
                className="relative aspect-square rounded-xl overflow-hidden"
              >
                <Image
                  src={url}
                  alt={`${workshop.title} photo ${i + 2}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 33vw"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
