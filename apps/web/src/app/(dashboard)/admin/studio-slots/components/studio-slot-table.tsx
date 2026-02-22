'use client'

import Link from 'next/link'
import { Pencil, Trash2, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export interface StudioSlotRow {
  id: string
  startTime: string
  endTime: string
  capacity: number
  isAvailable: boolean
  confirmedBookings: number
  createdAt: string
}

interface StudioSlotTableProps {
  slots: StudioSlotRow[]
  loading: boolean
  onEdit: (slot: StudioSlotRow) => void
  onDelete: (slotId: string) => void
  onToggleAvailability: (slotId: string, isAvailable: boolean) => void
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

function getSlotStatus(slot: StudioSlotRow) {
  const now = new Date()
  const start = new Date(slot.startTime)
  const end = new Date(slot.endTime)

  if (!slot.isAvailable) {
    return { label: 'Disabled', color: 'bg-gray-50 text-gray-600 border-0' }
  }
  if (now > end) {
    return { label: 'Past', color: 'bg-gray-50 text-gray-400 border-0' }
  }
  if (now >= start && now <= end) {
    return { label: 'Active', color: 'bg-green-50 text-green-600 border-0' }
  }
  if (slot.confirmedBookings >= slot.capacity) {
    return { label: 'Full', color: 'bg-orange-50 text-orange-600 border-0' }
  }
  return { label: 'Open', color: 'bg-blue-50 text-blue-600 border-0' }
}

export function StudioSlotTable({
  slots,
  loading,
  onEdit,
  onDelete,
  onToggleAvailability,
}: StudioSlotTableProps) {
  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#4379EE] border-r-transparent" />
        <p className="mt-4 text-gray-500">Loading studio slots...</p>
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500 text-lg">No studio slots found.</p>
        <p className="text-gray-400 text-sm mt-2">
          Click &ldquo;Add Slot&rdquo; to create your first open studio time slot.
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-gray-100 hover:bg-transparent">
          <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Date</TableHead>
          <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Time</TableHead>
          <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Bookings</TableHead>
          <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Status</TableHead>
          <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {slots.map((slot) => {
          const status = getSlotStatus(slot)
          return (
            <TableRow key={slot.id} className="border-gray-50 hover:bg-gray-50/50">
              <TableCell>
                <p className="font-semibold text-[#202224]">
                  {formatDate(slot.startTime)}
                </p>
              </TableCell>
              <TableCell className="text-gray-500 text-sm">
                {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
              </TableCell>
              <TableCell className="text-gray-500 text-sm">
                {slot.confirmedBookings} / {slot.capacity}
              </TableCell>
              <TableCell>
                <button
                  onClick={() => onToggleAvailability(slot.id, !slot.isAvailable)}
                  className="cursor-pointer"
                >
                  <Badge className={status.color}>{status.label}</Badge>
                </button>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/admin/studio-slots/${slot.id}`}
                    className="w-8 h-8 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 flex items-center justify-center transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => onEdit(slot)}
                    className="w-8 h-8 rounded-lg bg-blue-50 text-[#4379EE] hover:bg-blue-100 flex items-center justify-center transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(slot.id)}
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
