'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ShoppingBag,
  ChevronRight,
  Cpu,
  MemoryStick,
  Calendar,
  Clock,
  Monitor,
  Package,
  ArrowUpRight,
  Hash,
  Barcode,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// --- Types ---

interface OrderSummary {
  totalOrders: number
  pendingOrders: number
  totalSpent: string
}

interface OrderItem {
  id: string
  quantity: number
  priceAtPurchase: string
  serialNumber: string | null
  productSnapshot: {
    name: string
    properties?: {
      upc?: string
      sn?: string
      [key: string]: unknown
    }
  }
  product: { id: string; name: string; upc?: string; imageUrls: string[] }
}

interface Order {
  id: string
  status: string
  total: string
  subtotal: string
  discountAmount: string
  placedAt: string
  items: OrderItem[]
}

interface Workshop {
  workshopId: string
  title: string
  startDate: string
  endDate: string
}

interface StudioBooking {
  bookingId: string
  startTime: string
  endTime: string
  status: string
}

interface VM {
  id: string
  vmid: number
  name: string
  status: string
  memory: number
  cpuCores: number
}

// --- Status Badge ---

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700 ring-amber-600/10',
    PROCESSING: 'bg-blue-50 text-blue-700 ring-blue-600/10',
    SHIPPED: 'bg-purple-50 text-purple-700 ring-purple-600/10',
    DELIVERED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
    CANCELLED: 'bg-red-50 text-red-700 ring-red-600/10',
  }
  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ring-1 ring-inset ${styles[status] || 'bg-gray-50 text-gray-600 ring-gray-500/10'}`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}

// --- Section Card ---

function SectionCard({
  title,
  href,
  icon: Icon,
  iconBg,
  iconColor,
  children,
  emptyMessage,
  isEmpty,
}: {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
  children: React.ReactNode
  emptyMessage: string
  isEmpty: boolean
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`${iconBg} w-9 h-9 rounded-lg flex items-center justify-center`}
          >
            <Icon className={`w-[18px] h-[18px] ${iconColor}`} />
          </div>
          <h3 className="text-[15px] font-semibold text-gray-900">{title}</h3>
        </div>
        <Link
          href={href}
          className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-[#4379EE] transition-colors"
        >
          View all
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      {isEmpty ? (
        <div className="px-6 pb-6">
          <div className="flex flex-col items-center justify-center py-8 rounded-xl bg-gray-50/50">
            <div
              className={`${iconBg} w-10 h-10 rounded-full flex items-center justify-center mb-3 opacity-60`}
            >
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <p className="text-sm text-gray-400">{emptyMessage}</p>
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  )
}

// --- Helpers ---

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const sameDay = s.toDateString() === e.toDateString()
  if (sameDay) {
    return `${formatDate(start)}, ${formatTime(start)} – ${formatTime(end)}`
  }
  return `${formatDate(start)} – ${formatDate(end)}`
}

function getMonthAbbr(dateStr: string) {
  return new Date(dateStr)
    .toLocaleDateString('en-US', { month: 'short' })
    .toUpperCase()
}

function getDay(dateStr: string) {
  return new Date(dateStr).getDate()
}

// --- Main Page ---

export default function UserDashboardPage() {
  const { user, accessToken, isLoading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<OrderSummary | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [bookings, setBookings] = useState<StudioBooking[]>([])
  const [vms, setVMs] = useState<VM[]>([])

  useEffect(() => {
    if (!accessToken) return

    const headers = { Authorization: `Bearer ${accessToken}` }

    async function fetchAll() {
      try {
        const [summaryRes, ordersRes, workshopsRes, bookingsRes, vmsRes] =
          await Promise.all([
            fetch(`${apiUrl}/api/v1/orders/summary`, { headers }),
            fetch(`${apiUrl}/api/v1/orders?limit=5`, { headers }),
            fetch(`${apiUrl}/api/v1/workshops/my-registrations`, { headers }),
            fetch(`${apiUrl}/api/v1/studio-bookings/mine`, { headers }),
            fetch(`${apiUrl}/api/v1/vms/me`, { headers }),
          ])

        if (summaryRes.ok) {
          const data = await summaryRes.json()
          setSummary(data.summary)
        }
        if (ordersRes.ok) {
          const data = await ordersRes.json()
          setOrders(data.orders ?? [])
        }
        if (workshopsRes.ok) {
          const data = await workshopsRes.json()
          setWorkshops(data.workshops ?? [])
        }
        if (bookingsRes.ok) {
          const data = await bookingsRes.json()
          setBookings(data.bookings ?? [])
        }
        if (vmsRes.ok) {
          const data = await vmsRes.json()
          setVMs(data.vms ?? [])
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [accessToken])

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#4379EE] border-r-transparent" />
      </div>
    )
  }

  const now = new Date()
  const upcomingWorkshops = workshops
    .filter((w) => new Date(w.startDate) > now)
    .slice(0, 3)
  const upcomingBookings = bookings
    .filter((b) => new Date(b.startTime) > now && b.status === 'CONFIRMED')
    .slice(0, 3)

  const displayName = user?.email?.split('@')[0] || 'there'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {displayName}</p>
      </div>

      {/* Workshops & Studio Bookings — 2-col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Workshops */}
        <SectionCard
          title="Upcoming Workshops"
          href="/user/workshops"
          icon={Calendar}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          emptyMessage="No upcoming workshops"
          isEmpty={upcomingWorkshops.length === 0}
        >
          <div className="px-6 pb-5 space-y-2">
            {upcomingWorkshops.map((w) => (
              <div
                key={w.workshopId}
                className="flex items-center gap-3.5 p-3 rounded-xl bg-gray-50/70 hover:bg-gray-50 transition-colors"
              >
                <div className="w-11 h-11 rounded-lg bg-white border border-gray-100 flex flex-col items-center justify-center shrink-0 shadow-sm">
                  <span className="text-[10px] font-semibold text-blue-500 leading-none">
                    {getMonthAbbr(w.startDate)}
                  </span>
                  <span className="text-base font-bold text-gray-900 leading-tight">
                    {getDay(w.startDate)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {w.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDateRange(w.startDate, w.endDate)}
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-300 shrink-0" />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Upcoming Studio Bookings */}
        <SectionCard
          title="Studio Bookings"
          href="/user/studio-bookings"
          icon={Clock}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
          emptyMessage="No upcoming bookings"
          isEmpty={upcomingBookings.length === 0}
        >
          <div className="px-6 pb-5 space-y-2">
            {upcomingBookings.map((b) => (
              <div
                key={b.bookingId}
                className="flex items-center gap-3.5 p-3 rounded-xl bg-gray-50/70 hover:bg-gray-50 transition-colors"
              >
                <div className="w-11 h-11 rounded-lg bg-white border border-gray-100 flex flex-col items-center justify-center shrink-0 shadow-sm">
                  <span className="text-[10px] font-semibold text-emerald-500 leading-none">
                    {getMonthAbbr(b.startTime)}
                  </span>
                  <span className="text-base font-bold text-gray-900 leading-tight">
                    {getDay(b.startTime)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(b.startTime)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatTime(b.startTime)} – {formatTime(b.endTime)}
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-300 shrink-0" />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Recent Purchases */}
      <SectionCard
        title="Recent Purchases"
        href="/user/purchase-history"
        icon={ShoppingBag}
        iconBg="bg-orange-50"
        iconColor="text-orange-500"
        emptyMessage="No purchases yet"
        isEmpty={orders.length === 0}
      >
        <div className="px-6 pb-5">
          <div className="divide-y divide-gray-100">
            {orders.flatMap((order) =>
              order.items.map((item) => {
                const upc = item.product?.upc || item.productSnapshot?.properties?.upc || ''
                const sn = item.serialNumber || item.productSnapshot?.properties?.sn || ''
                const price = parseFloat(item.priceAtPurchase)
                const displayPrice = isNaN(price) ? '0.00' : price.toFixed(2)

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.productSnapshot?.name || item.product?.name || 'Unknown Product'}
                      </p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {upc && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                            <Barcode className="w-3 h-3 text-gray-400" />
                            <span className="font-mono bg-gray-50 px-1.5 py-0.5 rounded text-gray-600">{upc}</span>
                          </span>
                        )}
                        {sn && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                            <Hash className="w-3 h-3 text-gray-400" />
                            <span className="font-mono bg-blue-50 px-1.5 py-0.5 rounded text-blue-700">{sn}</span>
                          </span>
                        )}
                        <span className="text-[11px] text-gray-400">
                          {formatDate(order.placedAt)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-900">
                        ${displayPrice}
                      </p>
                      <div className="mt-1">
                        <StatusBadge status={order.status} />
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </SectionCard>

      {/* Virtual Machines */}
      <SectionCard
        title="My Virtual Machines"
        href="/user/vms"
        icon={Monitor}
        iconBg="bg-violet-50"
        iconColor="text-violet-500"
        emptyMessage="No VMs assigned"
        isEmpty={vms.length === 0}
      >
        <div className="px-6 pb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {vms.map((vm) => (
              <div
                key={vm.id}
                className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                      <Monitor className="w-4 h-4 text-violet-500" />
                    </div>
                    <span
                      className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                        vm.status === 'running'
                          ? 'bg-emerald-500'
                          : 'bg-gray-300'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {vm.name}
                    </p>
                    <p className="text-[11px] text-gray-400 capitalize">
                      {vm.status}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                    <Cpu className="w-3 h-3 text-gray-400" />
                    {vm.cpuCores} cores
                  </span>
                  <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                    <MemoryStick className="w-3 h-3 text-gray-400" />
                    {vm.memory >= 1024
                      ? `${(vm.memory / 1024).toFixed(0)} GB`
                      : `${vm.memory} MB`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
