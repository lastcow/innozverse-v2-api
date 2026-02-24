'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { OrderTable } from './components/order-table'
import { OrderDetailDialog } from './components/order-detail-dialog'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

interface OrderItem {
  id: string
  orderId: string
  productId: string
  quantity: number
  priceAtPurchase: string | number
  productSnapshot: Record<string, unknown>
  serialNumber: string | null
  product: {
    id: string
    name: string
  }
}

interface Order {
  id: string
  userId: string
  status: OrderStatus
  subtotal: string | number
  discountAmount: string | number
  tax: string | number
  total: string | number
  placedAt: string
  updatedAt: string
  user: {
    id: string
    email: string
    role?: string
  }
  items: OrderItem[]
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminOrdersPage() {
  const { accessToken, isLoading: authLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const fetchOrders = useCallback(async (page = 1) => {
    if (!accessToken) return
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (statusFilter) params.set('status', statusFilter)

      const response = await fetch(`${apiUrl}/api/v1/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders)
        setPagination(data.pagination)
      }
    } catch {
      toast.error('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }, [accessToken, statusFilter])

  useEffect(() => {
    if (accessToken) {
      fetchOrders()
    }
  }, [accessToken, fetchOrders])

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    try {
      const response = await fetch(`${apiUrl}/api/v1/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        toast.success('Order status updated')
        await fetchOrders(pagination.page)
        // Update selected order if dialog is open
        const data = await response.json().catch(() => null)
        if (data?.order && selectedOrder?.id === orderId) {
          setSelectedOrder(data.order)
        }
      } else {
        const err = await response.json()
        toast.error(err.error || 'Failed to update status')
      }
    } catch {
      toast.error('Failed to update order status')
    }
  }

  const handleSerialNumberUpdate = async (orderId: string, itemId: string, serialNumber: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/v1/admin/orders/${orderId}/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ serialNumber }),
      })

      if (response.ok) {
        toast.success('Serial number saved')
        await fetchOrders(pagination.page)
      } else {
        const err = await response.json()
        toast.error(err.error || 'Failed to save serial number')
      }
    } catch {
      toast.error('Failed to save serial number')
    }
  }

  const handlePageChange = (page: number) => {
    fetchOrders(page)
  }

  if (authLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#4379EE] border-r-transparent"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#202224]">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage customer orders, update statuses, and record serial numbers
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-[#202224] focus:outline-none focus:ring-2 focus:ring-[#4379EE]/20 focus:border-[#4379EE]"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <span className="text-sm text-gray-400">
          {pagination.total} order{pagination.total !== 1 ? 's' : ''} total
        </span>
      </div>

      {/* Orders Table Card */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <OrderTable
          orders={orders}
          loading={loading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onViewOrder={setSelectedOrder}
          onCancelOrder={async (orderId) => {
            await handleStatusUpdate(orderId, 'CANCELLED')
          }}
        />
      </div>

      {/* Order Detail Dialog */}
      <OrderDetailDialog
        order={selectedOrder}
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusUpdate={handleStatusUpdate}
        onSerialNumberUpdate={handleSerialNumberUpdate}
      />
    </div>
  )
}
