'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { UserTable } from './components/user-table'
import { UserForm } from './components/user-form'
import { UserSearch } from './components/user-search'
import { UserFilters } from './components/user-filters'
import { UserPagination } from './components/user-pagination'
import type { MockUser } from './components/user-table'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface UsersResponse {
  users: MockUser[]
  pagination: PaginationData
}

export default function AdminUsersPage() {
  const { accessToken, isLoading: authLoading } = useAuth()
  const searchParams = useSearchParams()

  const [users, setUsers] = useState<MockUser[]>([])
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<MockUser | null>(null)

  // Get query params
  const search = searchParams.get('search') || ''
  const role = searchParams.get('role') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)

  const fetchUsers = useCallback(async () => {
    if (!accessToken) return

    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '20')
      if (search) params.set('search', search)
      if (role) params.set('role', role)

      const response = await fetch(`${apiUrl}/api/v1/admin/users?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const data: UsersResponse = await response.json()

      if (!response.ok) {
        throw new Error((data as unknown as { error: string }).error || 'Failed to fetch users')
      }

      setUsers(data.users)
      setPagination(data.pagination)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [accessToken, page, search, role])

  useEffect(() => {
    if (accessToken) {
      fetchUsers()
    }
  }, [accessToken, fetchUsers])

  const handleEdit = (user: MockUser) => {
    setEditingUser(user)
    setIsFormOpen(true)
  }

  const handleDelete = async (userId: string) => {
    // Optimistically remove from UI
    setUsers((prev) => prev.filter((u) => u.id !== userId))
  }

  const handleFormSubmit = async (
    data: { name: string; email: string; role: MockUser['role']; status: MockUser['status'] },
    userId?: string
  ) => {
    // For now, handle locally and refetch
    if (userId) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...data } : u))
      )
    } else {
      const newUser: MockUser = {
        id: String(Date.now()),
        ...data,
        createdAt: new Date().toISOString(),
      }
      setUsers((prev) => [newUser, ...prev])
    }
    setIsFormOpen(false)
    setEditingUser(null)
    // Refetch to get the latest data
    fetchUsers()
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setEditingUser(null)
  }

  // Show loading state while auth is loading
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
          <h1 className="text-2xl font-bold text-[#202224]">
            Community Members
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View and manage all registered users across your platform
          </p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-[#4379EE] hover:bg-[#3568d4] text-white rounded-xl px-5"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-400 font-medium">Total Members</p>
          <p className="text-2xl font-bold text-[#202224] mt-1">
            {pagination?.total ?? users.length}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-400 font-medium">Active</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {users.filter((u) => u.status === 'ACTIVE').length}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-400 font-medium">Suspended</p>
          <p className="text-2xl font-bold text-red-500 mt-1">
            {users.filter((u) => u.status === 'SUSPENDED').length}
          </p>
        </div>
      </div>

      {/* Search and Filter Row */}
      <div className="flex items-center gap-4 mb-6">
        <UserSearch currentSearch={search} />
        <UserFilters currentRole={role} />
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchUsers}
            className="text-sm text-red-700 underline mt-2"
          >
            Try again
          </button>
        </div>
      )}

      {/* User Table Card */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <UserTable
          users={users}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <UserPagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              role={role}
              search={search}
            />
          </div>
        )}
      </div>

      {/* User Form Dialog */}
      <UserForm
        open={isFormOpen}
        user={editingUser}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
      />
    </div>
  )
}
