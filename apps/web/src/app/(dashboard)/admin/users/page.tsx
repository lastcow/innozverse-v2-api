'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserTable } from './components/user-table'
import { UserForm } from './components/user-form'
import type { MockUser } from './components/user-table'

const mockUsers: MockUser[] = [
  {
    id: '1',
    name: 'Alice Chen',
    email: 'alice.chen@innozverse.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2024-09-15T08:30:00Z',
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    email: 'marcus.j@innozverse.com',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: '2024-11-02T14:20:00Z',
  },
  {
    id: '3',
    name: 'System Operator',
    email: 'sysop@innozverse.com',
    role: 'SYSTEM',
    status: 'ACTIVE',
    createdAt: '2024-08-01T00:00:00Z',
  },
  {
    id: '4',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    role: 'USER',
    status: 'SUSPENDED',
    createdAt: '2025-01-10T11:45:00Z',
  },
  {
    id: '5',
    name: 'David Kim',
    email: 'david.kim@innozverse.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2024-10-22T09:15:00Z',
  },
  {
    id: '6',
    name: 'Sofia Martinez',
    email: 'sofia.m@example.com',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: '2025-02-01T16:30:00Z',
  },
]

export default function AdminUsersPage() {
  const [users, setUsers] = useState<MockUser[]>(mockUsers)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<MockUser | null>(null)

  const handleEdit = (user: MockUser) => {
    setEditingUser(user)
    setIsFormOpen(true)
  }

  const handleDelete = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId))
  }

  const handleFormSubmit = (
    data: { name: string; email: string; role: MockUser['role']; status: MockUser['status'] },
    userId?: string
  ) => {
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
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setEditingUser(null)
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
          <p className="text-2xl font-bold text-[#202224] mt-1">{users.length}</p>
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

      {/* User Table Card */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <UserTable
          users={users}
          loading={false}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
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
