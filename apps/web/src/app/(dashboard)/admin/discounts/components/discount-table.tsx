'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { EventDiscount } from '@repo/types'

interface DiscountTableProps {
  discounts: EventDiscount[]
  loading: boolean
  onEdit: (discount: EventDiscount) => void
  onDelete: (discountId: string) => void
  onToggleActive: (discountId: string, active: boolean) => void
}

const getDiscountStatus = (discount: EventDiscount) => {
  const now = new Date()
  const startDate = new Date(discount.startDate)
  const endDate = new Date(discount.endDate)

  if (!discount.active) {
    return { label: 'Inactive', color: 'bg-gray-50 text-gray-600 border-0' }
  }

  if (now < startDate) {
    return { label: 'Scheduled', color: 'bg-blue-50 text-blue-600 border-0' }
  }

  if (now > endDate) {
    return { label: 'Expired', color: 'bg-red-50 text-red-600 border-0' }
  }

  return { label: 'Active', color: 'bg-green-50 text-green-600 border-0' }
}

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function DiscountTable({
  discounts,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
}: DiscountTableProps) {
  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#4379EE] border-r-transparent"></div>
        <p className="mt-4 text-gray-500">Loading discounts...</p>
      </div>
    )
  }

  if (discounts.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500 text-lg">No discounts found.</p>
        <p className="text-gray-400 text-sm mt-2">
          Click &ldquo;Add Discount&rdquo; to create your first discount.
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-gray-100 hover:bg-transparent">
          <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Name</TableHead>
          <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Percentage</TableHead>
          <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Start Date</TableHead>
          <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">End Date</TableHead>
          <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Status</TableHead>
          <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {discounts.map((discount) => {
          const status = getDiscountStatus(discount)
          return (
            <TableRow key={discount.id} className="border-gray-50 hover:bg-gray-50/50">
              <TableCell>
                <div>
                  <p className="font-semibold text-[#202224]">{discount.name}</p>
                  {discount.description && (
                    <p className="text-sm text-gray-500 truncate max-w-xs">
                      {discount.description}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-semibold text-[#202224]">
                {Number(discount.percentage)}%
              </TableCell>
              <TableCell className="text-gray-500">
                {formatDate(discount.startDate)}
              </TableCell>
              <TableCell className="text-gray-500">
                {formatDate(discount.endDate)}
              </TableCell>
              <TableCell>
                <button
                  onClick={() => onToggleActive(discount.id, !discount.active)}
                  className="cursor-pointer"
                >
                  <Badge className={status.color}>
                    {status.label}
                  </Badge>
                </button>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(discount)}
                    className="w-8 h-8 rounded-lg bg-blue-50 text-[#4379EE] hover:bg-blue-100 flex items-center justify-center transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(discount.id)}
                    className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
