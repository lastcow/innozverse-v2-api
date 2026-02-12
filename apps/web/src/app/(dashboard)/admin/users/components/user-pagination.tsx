'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface UserPaginationProps {
  currentPage: number
  totalPages: number
  total: number
  limit: number
  role?: string
  search?: string
  onLimitChange: (limit: number) => void
}

export function UserPagination({
  currentPage,
  totalPages,
  total,
  limit,
  role,
  search,
  onLimitChange,
}: UserPaginationProps) {
  const buildUrl = (page: number) => {
    const params = new URLSearchParams()
    if (role) params.set('role', role)
    if (search) params.set('search', search)
    params.set('page', page.toString())
    params.set('limit', limit.toString())
    return `/admin/users?${params.toString()}`
  }

  const hasPrev = currentPage > 1
  const hasNext = currentPage < totalPages

  const start = (currentPage - 1) * limit + 1
  const end = Math.min(currentPage * limit, total)

  return (
    <div className="flex items-center justify-between">
      {/* Left: Rows per page */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>Rows per page:</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="h-8 rounded-md border border-gray-200 bg-white px-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#4379EE]"
        >
          {[10, 20, 50, 100].map((val) => (
            <option key={val} value={val}>
              {val}
            </option>
          ))}
        </select>
      </div>

      {/* Right: Page info + navigation */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">
          {total > 0 ? `${start}-${end} of ${total}` : '0 results'}
        </span>

        <div className="flex items-center gap-1">
          {/* First page */}
          {hasPrev ? (
            <Link
              href={buildUrl(1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <ChevronsLeft className="w-4 h-4" />
            </Link>
          ) : (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-300 cursor-not-allowed">
              <ChevronsLeft className="w-4 h-4" />
            </span>
          )}

          {/* Previous */}
          {hasPrev ? (
            <Link
              href={buildUrl(currentPage - 1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
          ) : (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-300 cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
            </span>
          )}

          {/* Page indicator */}
          <span className="text-sm font-medium text-gray-700 px-2">
            Page {currentPage} of {totalPages || 1}
          </span>

          {/* Next */}
          {hasNext ? (
            <Link
              href={buildUrl(currentPage + 1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-300 cursor-not-allowed">
              <ChevronRight className="w-4 h-4" />
            </span>
          )}

          {/* Last page */}
          {hasNext ? (
            <Link
              href={buildUrl(totalPages)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <ChevronsRight className="w-4 h-4" />
            </Link>
          ) : (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-300 cursor-not-allowed">
              <ChevronsRight className="w-4 h-4" />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
