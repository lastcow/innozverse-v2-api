'use client'

import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

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

interface OrderDetailDialogProps {
  order: Order | null
  open: boolean
  onClose: () => void
  onStatusUpdate: (orderId: string, status: OrderStatus) => Promise<void>
  onSerialNumberUpdate: (orderId: string, itemId: string, serialNumber: string) => Promise<void>
}

const statusColors: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700 border-0',
  PROCESSING: 'bg-blue-50 text-blue-700 border-0',
  SHIPPED: 'bg-purple-50 text-purple-700 border-0',
  DELIVERED: 'bg-green-50 text-green-700 border-0',
  CANCELLED: 'bg-red-50 text-red-700 border-0',
}

const allStatuses: OrderStatus[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

const formatPrice = (amount: string | number) => {
  return `$${formatCurrency(Number(amount))}`
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

/** Parse stored serial number string into array of individual SNs */
function parseSerialNumbers(sn: string | null, qty: number): string[] {
  if (!sn) return Array(qty).fill('')
  try {
    const parsed = JSON.parse(sn)
    if (Array.isArray(parsed)) {
      // Pad or trim to match qty
      const arr = parsed.map(String)
      while (arr.length < qty) arr.push('')
      return arr.slice(0, qty)
    }
  } catch {
    // Not JSON — treat as single SN for unit 1
  }
  const arr: string[] = [sn]
  while (arr.length < qty) arr.push('')
  return arr.slice(0, qty)
}

/** Serialize array of SNs back to storage format */
function serializeSerialNumbers(sns: string[]): string {
  const trimmed = sns.map((s) => s.trim())
  if (trimmed.length <= 1) return trimmed[0] || ''
  return JSON.stringify(trimmed)
}

export function OrderDetailDialog({
  order,
  open,
  onClose,
  onStatusUpdate,
  onSerialNumberUpdate,
}: OrderDetailDialogProps) {
  // Map of itemId -> array of SN strings (one per unit)
  const [serialNumbers, setSerialNumbers] = useState<Record<string, string[]>>({})
  const [savingItems, setSavingItems] = useState<Set<string>>(new Set())
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Sync serial numbers from order when it changes
  useEffect(() => {
    if (order) {
      const sns: Record<string, string[]> = {}
      order.items.forEach((item) => {
        sns[item.id] = parseSerialNumbers(item.serialNumber, item.quantity)
      })
      setSerialNumbers(sns)
    }
  }, [order])

  if (!order) return null

  const handleStatusChange = async (status: OrderStatus) => {
    setUpdatingStatus(true)
    try {
      await onStatusUpdate(order.id, status)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const updateSN = (itemId: string, unitIndex: number, value: string) => {
    setSerialNumbers((prev) => {
      const arr = [...(prev[itemId] || [])]
      arr[unitIndex] = value
      return { ...prev, [itemId]: arr }
    })
  }

  const handleSaveSerialNumber = async (itemId: string) => {
    setSavingItems((prev) => new Set(prev).add(itemId))
    try {
      const serialized = serializeSerialNumbers(serialNumbers[itemId] || [])
      await onSerialNumberUpdate(order.id, itemId, serialized)
    } finally {
      setSavingItems((prev) => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#202224]">
            Order Details
          </DialogTitle>
          <DialogDescription>
            Order {order.id.slice(0, 8)}... placed on {formatDate(order.placedAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400 text-xs uppercase tracking-wider">Customer</span>
              <p className="text-[#202224] font-medium mt-0.5">{order.user.email}</p>
            </div>
            <div>
              <span className="text-gray-400 text-xs uppercase tracking-wider">Status</span>
              <div className="mt-1">
                <Badge className={statusColors[order.status]}>{order.status}</Badge>
              </div>
            </div>
            <div>
              <span className="text-gray-400 text-xs uppercase tracking-wider">Subtotal</span>
              <p className="text-[#202224] mt-0.5">{formatPrice(order.subtotal)}</p>
            </div>
            <div>
              <span className="text-gray-400 text-xs uppercase tracking-wider">Discount</span>
              <p className="text-[#202224] mt-0.5">-{formatPrice(order.discountAmount)}</p>
            </div>
            <div>
              <span className="text-gray-400 text-xs uppercase tracking-wider">Tax</span>
              <p className="text-[#202224] mt-0.5">{formatPrice(order.tax)}</p>
            </div>
            <div>
              <span className="text-gray-400 text-xs uppercase tracking-wider">Total</span>
              <p className="text-[#202224] font-semibold mt-0.5">{formatPrice(order.total)}</p>
            </div>
          </div>

          {/* Items Table with per-unit SN inputs */}
          <div>
            <h3 className="text-sm font-semibold text-[#202224] mb-3">Order Items</h3>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80">
                  <tr className="text-gray-400 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-2.5 font-medium">Product</th>
                    <th className="text-left px-4 py-2.5 font-medium">Unit</th>
                    <th className="text-left px-4 py-2.5 font-medium">Price</th>
                    <th className="text-left px-4 py-2.5 font-medium">Serial Number</th>
                    <th className="px-4 py-2.5 font-medium w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => {
                    const productName = item.product?.name || (item.productSnapshot as { name?: string })?.name || 'Unknown Product'
                    const snArray = serialNumbers[item.id] || []
                    return Array.from({ length: item.quantity }, (_, unitIdx) => (
                      <tr
                        key={`${item.id}-${unitIdx}`}
                        className="border-t border-gray-100"
                      >
                        {/* Show product name + save button only on first row, span the rest */}
                        {unitIdx === 0 ? (
                          <td className="px-4 py-3 text-[#202224]" rowSpan={item.quantity}>
                            {productName}
                          </td>
                        ) : null}
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {item.quantity > 1 ? `#${unitIdx + 1}` : '1'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {unitIdx === 0 ? formatPrice(item.priceAtPurchase) : ''}
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            value={snArray[unitIdx] || ''}
                            onChange={(e) => updateSN(item.id, unitIdx, e.target.value)}
                            placeholder={`SN for unit ${unitIdx + 1}`}
                            className="h-8 text-sm font-mono"
                          />
                        </td>
                        {unitIdx === 0 ? (
                          <td className="px-4 py-3" rowSpan={item.quantity}>
                            <button
                              onClick={() => handleSaveSerialNumber(item.id)}
                              disabled={savingItems.has(item.id)}
                              className="w-8 h-8 rounded-lg bg-blue-50 text-[#4379EE] hover:bg-blue-100 flex items-center justify-center transition-colors disabled:opacity-40"
                              title="Save serial numbers"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        ) : null}
                      </tr>
                    ))
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Status Update */}
          <div>
            <h3 className="text-sm font-semibold text-[#202224] mb-3">Update Status</h3>
            <div className="flex items-center gap-3">
              <select
                id="status-select"
                defaultValue={order.status}
                disabled={updatingStatus}
                onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-[#202224] focus:outline-none focus:ring-2 focus:ring-[#4379EE]/20 focus:border-[#4379EE] disabled:opacity-50"
              >
                {allStatuses.filter((s) => s !== 'CANCELLED').map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {updatingStatus && (
                <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-[#4379EE] border-r-transparent"></div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-200 rounded-xl"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
