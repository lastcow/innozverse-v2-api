'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface MockUser {
  id: string
  fname?: string | null
  mname?: string | null
  lname?: string | null
  email: string
  role: 'USER' | 'ADMIN' | 'SYSTEM'
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING'
  emailVerified?: boolean
  createdAt: string
  studentVerification?: {
    id: string
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
  } | null
}

interface UserTableProps {
  users: MockUser[]
  loading: boolean
  onEdit: (user: MockUser) => void
  onDelete: (user: MockUser) => void
  accessToken?: string
  onRefresh?: () => void
}

const getRoleBadge = (role: MockUser['role']) => {
  const styles = {
    ADMIN: 'bg-green-50 text-green-600 border-0',
    USER: 'bg-blue-50 text-[#4379EE] border-0',
    SYSTEM: 'bg-purple-50 text-purple-600 border-0',
  }
  return styles[role]
}

const getDisplayName = (user: MockUser) => {
  const parts = [user.fname, user.mname, user.lname].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : user.email.split('@')[0]
}

const getInitials = (user: MockUser) => {
  if (user.fname || user.lname) {
    return [(user.fname || '')[0], (user.lname || '')[0]]
      .filter(Boolean)
      .join('')
      .toUpperCase()
  }
  return (user.email.split('@')[0] ?? '?')[0]!.toUpperCase()
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function UserTable({ users, loading, onEdit, onDelete, accessToken, onRefresh }: UserTableProps) {
  const router = useRouter()
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleRowClick = (userId: string) => {
    router.push(`/admin/users/${userId}`)
  }

  const handleManualVerify = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation()
    if (!accessToken) return

    setActionLoading(userId)
    try {
      const res = await fetch(`${apiUrl}/api/v1/admin/users/${userId}/student-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to verify user')
      }

      onRefresh?.()
    } catch (err) {
      console.error('Manual verification failed:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleVerificationAction = async (
    e: React.MouseEvent,
    verificationId: string,
    action: 'APPROVED' | 'REJECTED'
  ) => {
    e.stopPropagation()
    if (!accessToken) return

    setActionLoading(verificationId)
    try {
      const res = await fetch(`${apiUrl}/api/v1/admin/student-verifications/${verificationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: action }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `Failed to ${action.toLowerCase()} verification`)
      }

      onRefresh?.()
    } catch (err) {
      console.error('Verification action failed:', err)
    } finally {
      setActionLoading(null)
    }
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
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50/80">
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">
              User
            </th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">
              Role
            </th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">
              Status
            </th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">
              Student
            </th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">
              Joined
            </th>
            <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleRowClick(user.id)}
            >
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                    {getInitials(user)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="font-medium text-[#202224] truncate">{getDisplayName(user)}</p>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4">
                <Badge className={getRoleBadge(user.role)}>{user.role}</Badge>
              </td>
              <td className="px-5 py-4">
                {user.status === 'ACTIVE' ? (
                  <Badge className="bg-green-50 text-green-600 border-0">Active</Badge>
                ) : user.status === 'SUSPENDED' ? (
                  <Badge className="bg-red-50 text-red-600 border-0">Suspended</Badge>
                ) : (
                  <Badge className="bg-yellow-50 text-yellow-600 border-0">Pending</Badge>
                )}
              </td>
              <td className="px-5 py-4">
                {user.studentVerification ? (
                  user.studentVerification.status === 'APPROVED' ? (
                    <Badge className="bg-green-50 text-green-600 border-0">Verified</Badge>
                  ) : user.studentVerification.status === 'PENDING' ? (
                    <div className="flex items-center gap-1.5">
                      <Badge className="bg-yellow-50 text-yellow-600 border-0">Pending</Badge>
                      {accessToken && (
                        <>
                          <button
                            onClick={(e) =>
                              handleVerificationAction(e, user.studentVerification!.id, 'APPROVED')
                            }
                            disabled={actionLoading === user.studentVerification.id}
                            className="w-6 h-6 rounded-md bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) =>
                              handleVerificationAction(e, user.studentVerification!.id, 'REJECTED')
                            }
                            disabled={actionLoading === user.studentVerification.id}
                            className="w-6 h-6 rounded-md bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors disabled:opacity-50"
                            title="Reject"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Badge className="bg-red-50 text-red-600 border-0">Rejected</Badge>
                      {accessToken && (
                        <button
                          onClick={(e) => handleManualVerify(e, user.id)}
                          disabled={actionLoading === user.id}
                          className="w-6 h-6 rounded-md bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors disabled:opacity-50"
                          title="Verify as Student"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-gray-400">&mdash;</span>
                    {accessToken && (
                      <button
                        onClick={(e) => handleManualVerify(e, user.id)}
                        disabled={actionLoading === user.id}
                        className="w-6 h-6 rounded-md bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors disabled:opacity-50"
                        title="Verify as Student"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </td>
              <td className="px-5 py-4 text-gray-500 text-sm">
                {formatDate(user.createdAt)}
              </td>
              <td className="px-5 py-4 text-right">
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
                      onDelete(user)
                    }}
                    className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
