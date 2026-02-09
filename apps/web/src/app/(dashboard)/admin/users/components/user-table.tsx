'use client'

import { useRouter } from 'next/navigation'
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

export interface MockUser {
  id: string
  name: string
  email: string
  role: 'USER' | 'ADMIN' | 'SYSTEM'
  status: 'ACTIVE' | 'SUSPENDED'
  createdAt: string
}

interface UserTableProps {
  users: MockUser[]
  loading: boolean
  onEdit: (user: MockUser) => void
  onDelete: (userId: string) => void
}

const getRoleBadge = (role: MockUser['role']) => {
  const styles = {
    ADMIN: 'bg-green-50 text-green-600 border-0',
    USER: 'bg-blue-50 text-[#4379EE] border-0',
    SYSTEM: 'bg-purple-50 text-purple-600 border-0',
  }
  return styles[role]
}

const getStatusBadge = (status: MockUser['status']) => {
  const styles = {
    ACTIVE: 'bg-green-50 text-green-600 border-0',
    SUSPENDED: 'bg-red-50 text-red-500 border-0',
  }
  return styles[status]
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function UserTable({ users, loading, onEdit, onDelete }: UserTableProps) {
  const router = useRouter()

  const handleRowClick = (userId: string) => {
    router.push(`/admin/users/${userId}`)
  }

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#4379EE] border-r-transparent"></div>
        <p className="mt-4 text-gray-500">Loading members...</p>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500 text-lg">No members found.</p>
        <p className="text-gray-400 text-sm mt-2">
          Click &ldquo;Add User&rdquo; to invite your first member.
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-gray-100 hover:bg-transparent">
          <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">User</TableHead>
          <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Role</TableHead>
          <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Status</TableHead>
          <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Joined</TableHead>
          <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow
            key={user.id}
            className="border-gray-50 hover:bg-gray-50/50 cursor-pointer"
            onClick={() => handleRowClick(user.id)}
          >
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                  {getInitials(user.name)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[#202224] truncate">{user.name}</p>
                  <p className="text-sm text-gray-400 truncate">{user.email}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge className={getRoleBadge(user.role)}>{user.role}</Badge>
            </TableCell>
            <TableCell>
              <Badge className={getStatusBadge(user.status)}>
                {user.status === 'ACTIVE' ? 'Active' : 'Suspended'}
              </Badge>
            </TableCell>
            <TableCell className="text-gray-500">
              {formatDate(user.createdAt)}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(user)
                  }}
                  className="w-8 h-8 rounded-lg bg-blue-50 text-[#4379EE] hover:bg-blue-100 flex items-center justify-center transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(user.id)
                  }}
                  className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
