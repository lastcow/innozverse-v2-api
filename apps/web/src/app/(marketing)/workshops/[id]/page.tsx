import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { CalendarDays, Users, ArrowLeft, ShoppingBag } from 'lucide-react'
import { RegisterButton } from '@/components/workshops/register-button'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const TZ = 'America/Toronto'

function formatDateRange(start: string, end: string) {
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: TZ,
  }
  return `${new Date(start).toLocaleDateString('en-US', opts)} - ${new Date(end).toLocaleDateString('en-US', opts)}`
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: TZ,
  })
}

export default async function WorkshopDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth().catch(() => null)
  const isAuthenticated = !!session?.user?.id

  const headers: Record<string, string> = {}
  if (session?.accessToken) {
    headers['Authorization'] = `Bearer ${session.accessToken}`
  }

  let res = await fetch(`${apiUrl}/api/v1/workshops/${params.id}`, {
    cache: 'no-store',
    headers,
  })

  // If auth caused a failure, retry as guest
  if (!res.ok && headers['Authorization']) {
    res = await fetch(`${apiUrl}/api/v1/workshops/${params.id}`, {
      cache: 'no-store',
    })
  }

  if (!res.ok) {
    notFound()
  }

  const { workshop, isRegistered } = await res.json()

  const images = Array.isArray(workshop.imageUrls)
    ? (workshop.imageUrls as string[])
    : []
  const now = new Date()
  const isPast = new Date(workshop.endDate) < now
  const totalSeats = workshop.totalSeats ?? workshop._count?.registrations ?? 0
  const isFull =
    workshop.capacity > 0 &&
    totalSeats >= workshop.capacity
  const availableSeats =
    workshop.capacity > 0 ? workshop.capacity - totalSeats : null
  const seatsText =
    workshop.capacity > 0
      ? `${totalSeats} / ${workshop.capacity} Seats Taken`
      : 'Unlimited Seats'

  const products = Array.isArray(workshop.products) ? workshop.products as Array<{
    id: string
    name: string
    basePrice: string
    quantity: number
  }> : []

  const totalPrice = products.reduce(
    (sum, p) => sum + Number(p.basePrice) * p.quantity,
    0
  )

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

      {/* Required Products */}
      {products.length > 0 && (
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-amber-900">
              Materials required &mdash; order online or purchase on arrival
            </h3>
          </div>
          <ul className="space-y-2 mb-3">
            {products.map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <Link
                  href={`/products/${p.id}`}
                  className="text-amber-800 hover:text-[#4379EE] hover:underline"
                >
                  {p.name}
                  {p.quantity > 1 && <span className="text-amber-600 ml-1">&times;{p.quantity}</span>}
                </Link>
                <span className="text-amber-700 font-medium">
                  ${(Number(p.basePrice) * p.quantity).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-amber-200 pt-2 text-sm font-semibold text-amber-900">
            <span>Total</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Registration Button */}
      <div className="mb-8 max-w-xs">
        <RegisterButton
          workshopId={workshop.id}
          isAuthenticated={isAuthenticated}
          isRegistered={isRegistered}
          isFull={isFull}
          isPast={isPast}
          availableSeats={availableSeats}
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
