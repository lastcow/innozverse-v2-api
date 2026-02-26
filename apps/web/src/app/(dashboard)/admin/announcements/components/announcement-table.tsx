'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface Announcement {
  id: string
  title: string
  content: string
  active: boolean
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
}

interface AnnouncementTableProps {
  announcements: Announcement[]
  loading: boolean
  onEdit: (announcement: Announcement) => void
  onDelete: (id: string) => void
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getStatus(a: Announcement) {
  if (!a.active) return 'inactive'
  const now = new Date()
  const start = new Date(a.startDate)
  const end = new Date(a.endDate)
  if (now < start) return 'scheduled'
  if (now > end) return 'expired'
  return 'live'
}

const statusConfig = {
  live: { label: 'Live', className: 'bg-green-50 text-green-600 border-0' },
  scheduled: { label: 'Scheduled', className: 'bg-blue-50 text-blue-600 border-0' },
  expired: { label: 'Expired', className: 'bg-gray-100 text-gray-500 border-0' },
  inactive: { label: 'Inactive', className: 'bg-red-50 text-red-600 border-0' },
}

export function AnnouncementTable({ announcements, loading, onEdit, onDelete }: AnnouncementTableProps) {
  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#4379EE] border-r-transparent"></div>
        <p className="mt-4 text-gray-500">Loading announcements...</p>
      </div>
    )
  }

  if (announcements.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500 text-lg">No announcements found.</p>
        <p className="text-gray-400 text-sm mt-2">
          Click &ldquo;Add Announcement&rdquo; to create your first announcement.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50/80">
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">
              Title
            </th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">
              Status
            </th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">
              Date Range
            </th>
            <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {announcements.map((a) => {
            const status = getStatus(a)
            const cfg = statusConfig[status]
            return (
              <tr
                key={a.id}
                className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                <td className="px-5 py-4">
                  <div className="flex flex-col min-w-0">
                    <p className="font-medium text-gray-900">{a.title}</p>
                    <p className="text-xs text-gray-400 truncate max-w-[300px]">{a.content}</p>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <Badge className={cfg.className}>{cfg.label}</Badge>
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">
                  {formatDate(a.startDate)} — {formatDate(a.endDate)}
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(a)}
                      className="w-8 h-8 rounded-lg bg-blue-50 text-[#4379EE] hover:bg-blue-100 flex items-center justify-center transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(a.id)}
                      className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
