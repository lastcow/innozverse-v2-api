import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@repo/database'
import { CalendarDays, Users, ImageIcon } from 'lucide-react'
import { WorkshopCalendar } from '@/components/workshops/workshop-calendar'
import { WorkshopHero } from '@/components/workshops/workshop-hero'

function formatDateRange(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }
  return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}`
}

function getWorkshopDays(workshops: { startDate: Date; endDate: Date }[]) {
  const days: string[] = []
  workshops.forEach((w) => {
    const current = new Date(w.startDate)
    current.setHours(0, 0, 0, 0)
    const endDay = new Date(w.endDate)
    endDay.setHours(0, 0, 0, 0)
    while (current <= endDay) {
      days.push(current.toISOString())
      current.setDate(current.getDate() + 1)
    }
  })
  return days
}

export default async function WorkshopsPage() {
  const workshops = await prisma.workshop.findMany({
    where: { isPublished: true },
    orderBy: { startDate: 'asc' },
    include: { _count: { select: { registrations: true } } },
  })

  const now = new Date()
  const upcoming = workshops.filter((w) => new Date(w.startDate) > now)
  const past = workshops.filter((w) => new Date(w.endDate) < now)
  const workshopDays = getWorkshopDays(workshops)

  return (
    <>
    <WorkshopHero />

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* 2-Column Layout */}
      <div className="grid lg:grid-cols-[350px_1fr] gap-8">
        {/* Left Column: Calendar + Past Workshops */}
        <aside className="space-y-8">
          <WorkshopCalendar workshopDays={workshopDays} />

          {past.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-[#202224] mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-gray-400" />
                Past Workshops
              </h2>
              <div className="space-y-3">
                {past.map((workshop) => {
                  const images = Array.isArray(workshop.imageUrls)
                    ? (workshop.imageUrls as string[])
                    : []
                  return (
                    <Link
                      key={workshop.id}
                      href={`/workshops/${workshop.id}`}
                      className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {images[0] ? (
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={images[0]}
                            alt={workshop.title}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <CalendarDays className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#202224] truncate">
                          {workshop.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDateRange(workshop.startDate, workshop.endDate)}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </aside>

        {/* Right Column: Upcoming Workshops */}
        <main>
          <h2 className="text-2xl font-bold text-[#202224] mb-6 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-[#4379EE]" />
            Upcoming Workshops
          </h2>

          {upcoming.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <p className="text-gray-500 text-lg">
                No upcoming workshops scheduled.
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Check back soon for new events!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {upcoming.map((workshop) => {
                const images = Array.isArray(workshop.imageUrls)
                  ? (workshop.imageUrls as string[])
                  : []
                const registered = workshop._count.registrations
                const seatsText =
                  workshop.capacity > 0
                    ? `${registered} / ${workshop.capacity} Seats Taken`
                    : null

                return (
                  <Link
                    key={workshop.id}
                    href={`/workshops/${workshop.id}`}
                    className="block bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="sm:flex">
                      {images[0] ? (
                        <div className="relative sm:w-56 h-48 sm:h-auto flex-shrink-0">
                          <Image
                            src={images[0]}
                            alt={workshop.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, 224px"
                          />
                        </div>
                      ) : (
                        <div className="sm:w-56 h-48 sm:h-auto bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0">
                          <CalendarDays className="w-12 h-12 text-[#4379EE]/30" />
                        </div>
                      )}
                      <div className="p-6 flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-[#202224] mb-1">
                          {workshop.title}
                        </h3>
                        <p className="text-sm text-[#4379EE] font-medium mb-2">
                          {formatDateRange(workshop.startDate, workshop.endDate)}
                        </p>
                        {seatsText && (
                          <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                            <Users className="w-4 h-4" />
                            {seatsText}
                          </p>
                        )}
                        <p className="text-gray-500 text-sm line-clamp-2">
                          {workshop.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
    </>
  )
}
