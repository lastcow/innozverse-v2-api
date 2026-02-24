'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { UserTable } from './components/user-table'
import { UserForm } from './components/user-form'
import { UserDeleteDialog } from './components/user-delete-dialog'
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
  const router = useRouter()

  const [users, setUsers] = useState<MockUser[]>([])
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<MockUser | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletingUser, setDeletingUser] = useState<MockUser | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Get query params
  const search = searchParams.get('search') || ''
  const role = searchParams.get('role') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  const fetchUsers = useCallback(async () => {
    if (!accessToken) return

    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', limit.toString())
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
  }, [accessToken, page, limit, search, role])

  useEffect(() => {
    if (accessToken) {
      fetchUsers()
    }
  }, [accessToken, fetchUsers])

  const handleEdit = (user: MockUser) => {
    setEditingUser(user)
    setIsFormOpen(true)
  }

  const handleDelete = (user: MockUser) => {
    setDeletingUser(user)
    setIsDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!accessToken || !deletingUser) return

    setDeleteLoading(true)
    try {
      const response = await fetch(`${apiUrl}/api/v1/admin/users/${deletingUser.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to delete user')
      }

      setIsDeleteOpen(false)
      setDeletingUser(null)
      fetchUsers()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user'
      setError(errorMessage)
      setIsDeleteOpen(false)
      setDeletingUser(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteOpen(false)
    setDeletingUser(null)
  }

  const handleFormSubmit = async (
    data: { fname: string; mname?: string; lname: string; email: string; role: MockUser['role']; status: MockUser['status'] },
    userId?: string
  ) => {
    if (!accessToken) return

    try {
      if (userId) {
        const response = await fetch(`${apiUrl}/api/v1/admin/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            fname: data.fname,
            mname: data.mname || null,
            lname: data.lname,
            email: data.email,
            role: data.role,
            status: data.status,
          }),
        })

        if (!response.ok) {
          const err = await response.json()
          throw new Error(err.error || 'Failed to update user')
        }
      }
      setIsFormOpen(false)
      setEditingUser(null)
      fetchUsers()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save user'
      setError(errorMessage)
    }
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setEditingUser(null)
  }

  const handleLimitChange = (newLimit: number) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (role) params.set('role', role)
    params.set('page', '1')
    params.set('limit', newLimit.toString())
    router.push(`/admin/users?${params.toString()}`)
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#202224]">
          Community Members
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          View and manage all registered users across your platform
        </p>
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
          <p className="text-sm text-gray-400 font-medium">Verified</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {users.filter((u) => u.emailVerified).length}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-400 font-medium">Unverified</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {users.filter((u) => !u.emailVerified).length}
          </p>
        </div>
      </div>

      {/* Search, Filter, and Add User Row */}
      <div className="flex items-center gap-4 mb-6">
        <UserSearch currentSearch={search} />
        <UserFilters currentRole={role} />
        <div className="ml-auto">
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-[#4379EE] hover:bg-[#3568d4] text-white rounded-xl px-5"
            size="lg"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Add User
          </Button>
        </div>
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

      {/* User Table Card — Board Style */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <UserTable
          users={users}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          accessToken={accessToken ?? undefined}
          onRefresh={fetchUsers}
        />

        {/* Footer: Pagination */}
        <div className="border-t border-gray-100 px-5 py-4">
          <UserPagination
            currentPage={pagination?.page ?? 1}
            totalPages={pagination?.totalPages ?? 1}
            total={pagination?.total ?? 0}
            limit={limit}
            role={role}
            search={search}
            onLimitChange={handleLimitChange}
          />
        </div>
      </div>

      {/* User Form Dialog */}
      <UserForm
        open={isFormOpen}
        user={editingUser}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
      />

      {/* Delete Confirmation Dialog */}
      <UserDeleteDialog
        open={isDeleteOpen}
        user={deletingUser}
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  )
}
