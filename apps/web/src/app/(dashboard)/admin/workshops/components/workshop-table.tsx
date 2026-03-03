'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Pencil, Trash2, Eye } from 'lucide-react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
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
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Workshop } from '@repo/types'

interface WorkshopTableProps {
  workshops: Workshop[]
  loading: boolean
  onEdit: (workshop: Workshop) => void
  onDelete: (workshopId: string) => void
  onTogglePublished: (workshopId: string, isPublished: boolean) => void
}

const getWorkshopStatus = (workshop: Workshop) => {
  const now = new Date()
  const startDate = new Date(workshop.startDate)
  const endDate = new Date(workshop.endDate)

  if (!workshop.isPublished) {
    return { label: 'Draft', color: 'bg-gray-50 text-gray-600 border-0' }
  }

  if (now < startDate) {
    return { label: 'Upcoming', color: 'bg-blue-50 text-blue-600 border-0' }
  }

  if (now > endDate) {
    return { label: 'Past', color: 'bg-gray-50 text-gray-400 border-0' }
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

const formatDateTime = (date: Date | string) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function WorkshopTable({
  workshops,
  loading,
  onEdit,
  onDelete,
  onTogglePublished,
}: WorkshopTableProps) {
  const [itemToDelete, setItemToDelete] = useState<Workshop | null>(null)

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#4379EE] border-r-transparent"></div>
        <p className="mt-4 text-gray-500">Loading workshops...</p>
      </div>
    )
  }

  if (workshops.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500 text-lg">No workshops found.</p>
        <p className="text-gray-400 text-sm mt-2">
          Click &ldquo;Add Workshop&rdquo; to create your first workshop.
        </p>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="border-gray-100 hover:bg-transparent">
            <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider w-12"></TableHead>
            <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Title</TableHead>
            <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Dates</TableHead>
            <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Bookings</TableHead>
            <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Status</TableHead>
            <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workshops.map((workshop) => {
            const status = getWorkshopStatus(workshop)
            const images = Array.isArray(workshop.imageUrls)
              ? (workshop.imageUrls as string[])
              : []

            return (
              <TableRow key={workshop.id} className="border-gray-50 hover:bg-gray-50/50">
                <TableCell>
                  {images.length > 0 && images[0] ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden relative">
                      <Image
                        src={images[0]}
                        alt={workshop.title}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100" />
                  )}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-semibold text-[#202224]">{workshop.title}</p>
                    <p className="text-sm text-gray-500 truncate max-w-xs">
                      {workshop.description}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-gray-500 text-sm">
                  {formatDate(workshop.startDate)} - {formatDate(workshop.endDate)}
                </TableCell>
                <TableCell className="text-gray-500 text-sm">
                  {(workshop as Workshop & { registrationCount?: number }).registrationCount ?? 0}
                  /
                  {(workshop as Workshop & { capacity?: number }).capacity
                    ? (workshop as Workshop & { capacity?: number }).capacity
                    : '∞'}
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => onTogglePublished(workshop.id, !workshop.isPublished)}
                    className="cursor-pointer"
                  >
                    <Badge className={status.color}>
                      {status.label}
                    </Badge>
                  </button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/workshops/${workshop.id}`}
                      className="w-8 h-8 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 flex items-center justify-center transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => onEdit(workshop)}
                      className="w-8 h-8 rounded-lg bg-blue-50 text-[#4379EE] hover:bg-blue-100 flex items-center justify-center transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setItemToDelete(workshop)}
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

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => { if (!open) setItemToDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workshop?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {itemToDelete && (
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
                    <dt className="font-medium text-gray-700">Title:</dt>
                    <dd className="text-gray-600">{itemToDelete.title}</dd>
                    <dt className="font-medium text-gray-700">Start:</dt>
                    <dd className="text-gray-600">{formatDateTime(itemToDelete.startDate)}</dd>
                    <dt className="font-medium text-gray-700">End:</dt>
                    <dd className="text-gray-600">{formatDateTime(itemToDelete.endDate)}</dd>
                    <dt className="font-medium text-gray-700">Capacity:</dt>
                    <dd className="text-gray-600">
                      {itemToDelete.capacity > 0 ? itemToDelete.capacity : 'Unlimited'}
                    </dd>
                  </dl>
                )}
                <p className="text-red-600 text-sm font-medium">
                  This action cannot be undone. This will permanently delete the workshop and all related registrations.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (itemToDelete) {
                  onDelete(itemToDelete.id)
                  setItemToDelete(null)
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
