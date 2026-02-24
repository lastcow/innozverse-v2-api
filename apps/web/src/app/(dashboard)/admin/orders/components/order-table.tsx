'use client'

import { useState } from 'react'
import { Eye, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, XCircle, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

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

interface OrderTableProps {
  orders: Order[]
  loading: boolean
  pagination: Pagination
  onPageChange: (page: number) => void
  onViewOrder: (order: Order) => void
  onCancelOrder: (orderId: string) => Promise<void>
}

const statusColors: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700 border-0',
  PROCESSING: 'bg-blue-50 text-blue-700 border-0',
  SHIPPED: 'bg-purple-50 text-purple-700 border-0',
  DELIVERED: 'bg-green-50 text-green-700 border-0',
  CANCELLED: 'bg-red-50 text-red-700 border-0',
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const formatPrice = (amount: string | number) => {
  return `$${formatCurrency(Number(amount))}`
}

/** Parse stored serial number string into array of individual SNs */
function parseSerialNumbers(sn: string | null, qty: number): string[] {
  if (!sn) return Array(qty).fill('')
  try {
    const parsed = JSON.parse(sn)
    if (Array.isArray(parsed)) {
      const arr = parsed.map(String)
      while (arr.length < qty) arr.push('')
      return arr.slice(0, qty)
    }
  } catch {
    // Not JSON
  }
  const arr: string[] = [sn]
  while (arr.length < qty) arr.push('')
  return arr.slice(0, qty)
}

export function OrderTable({ orders, loading, pagination, onPageChange, onViewOrder, onCancelOrder }: OrderTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [cancelDialogOrderId, setCancelDialogOrderId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const handleCancelOrder = async () => {
    if (!cancelDialogOrderId) return
    setCancelling(true)
    try {
      await onCancelOrder(cancelDialogOrderId)
      setCancelDialogOrderId(null)
    } finally {
      setCancelling(false)
    }
  }

  const toggleExpand = (orderId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(orderId)) {
        next.delete(orderId)
      } else {
        next.add(orderId)
      }
      return next
    })
  }

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#4379EE] border-r-transparent"></div>
        <p className="mt-4 text-gray-500">Loading orders...</p>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500 text-lg">No orders found.</p>
        <p className="text-gray-400 text-sm mt-2">
          Orders will appear here once customers make purchases.
        </p>
      </div>
    )
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow className="border-gray-100 hover:bg-transparent">
            <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider w-8"></TableHead>
            <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Order ID</TableHead>
            <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Customer</TableHead>
            <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Items</TableHead>
            <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Total</TableHead>
            <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Status</TableHead>
            <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Placed</TableHead>
            <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const isExpanded = expandedRows.has(order.id)
            return (
              <>
                <TableRow key={order.id} className="border-gray-50 hover:bg-gray-50/50">
                  <TableCell className="w-8 pr-0">
                    <button
                      onClick={() => toggleExpand(order.id)}
                      className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-[#202224]">
                    {order.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {order.user.email}
                  </TableCell>
                  <TableCell className="text-[#202224] font-medium">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </TableCell>
                  <TableCell className="font-semibold text-[#202224]">
                    {formatPrice(order.total)}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[order.status]}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {formatDate(order.placedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onViewOrder(order)}
                        className="w-8 h-8 rounded-lg bg-blue-50 text-[#4379EE] hover:bg-blue-100 flex items-center justify-center transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {!['DELIVERED', 'CANCELLED'].includes(order.status) && (
                        <button
                          onClick={() => setCancelDialogOrderId(order.id)}
                          className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                          title="Cancel order"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow key={`${order.id}-details`} className="bg-gray-50/30 hover:bg-gray-50/30">
                    <TableCell colSpan={8} className="p-0">
                      <div className="px-6 py-3 border-t border-gray-100">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-gray-400 text-xs uppercase tracking-wider">
                              <th className="text-left py-1 font-medium">Product</th>
                              <th className="text-left py-1 font-medium">Qty</th>
                              <th className="text-left py-1 font-medium">Price</th>
                              <th className="text-left py-1 font-medium">Serial Number</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item) => {
                              const productName = item.product?.name || (item.productSnapshot as { name?: string })?.name || 'Unknown Product'
                              const snList = parseSerialNumbers(item.serialNumber, item.quantity)
                              return Array.from({ length: item.quantity }, (_, unitIdx) => (
                                <tr key={`${item.id}-${unitIdx}`} className="border-t border-gray-100/50">
                                  {unitIdx === 0 && (
                                    <td className="py-2 text-[#202224]" rowSpan={item.quantity}>
                                      {productName}
                                    </td>
                                  )}
                                  <td className="py-2 text-gray-600">
                                    {item.quantity > 1 ? `#${unitIdx + 1}` : item.quantity}
                                  </td>
                                  <td className="py-2 text-gray-600">
                                    {unitIdx === 0 ? formatPrice(item.priceAtPurchase) : ''}
                                  </td>
                                  <td className="py-2">
                                    {snList[unitIdx] ? (
                                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                                        {snList[unitIdx]}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400 text-xs">Not assigned</span>
                                    )}
                                  </td>
                                </tr>
                              ))
                            })}
                          </tbody>
                        </table>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            )
          })}
        </TableBody>
      </Table>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} orders)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <AlertDialog
        open={!!cancelDialogOrderId}
        onOpenChange={(open) => {
          if (!open && !cancelling) setCancelDialogOrderId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? Stock will be restored for all items. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep Order</AlertDialogCancel>
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-70 transition-colors"
            >
              {cancelling && <Loader2 className="w-4 h-4 animate-spin" />}
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
