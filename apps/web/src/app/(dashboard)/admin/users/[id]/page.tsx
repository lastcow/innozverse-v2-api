'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Mail, Calendar, ShieldCheck, Package, User as UserIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface Product {
  id: string
  name: string
  basePrice: number
  imageUrls: string[]
  type: string
}

interface OrderItem {
  id: string
  quantity: number
  price: string
  product: Product
}

interface Order {
  id: string
  status: string
  subtotal: string
  total: string
  placedAt: string
  items: OrderItem[]
}

interface StudentVerification {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  verificationMethod: string
  createdAt: string
  verifiedAt?: string
  verifiedBy?: {
    id: string
    email: string
  }
}

interface UserDetail {
  id: string
  email: string
  role: 'USER' | 'ADMIN' | 'SYSTEM'
  emailVerified: boolean
  oauthProvider?: string
  createdAt: string
  updatedAt: string
  orders: Order[]
  studentVerification?: StudentVerification
}

const orderStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const verificationStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
}

const getRoleBadgeStyle = (role: string) => {
  const styles: Record<string, string> = {
    ADMIN: 'bg-green-50 text-green-600 border-0',
    USER: 'bg-blue-50 text-[#4379EE] border-0',
    SYSTEM: 'bg-purple-50 text-purple-600 border-0',
  }
  return styles[role] || 'bg-gray-50 text-gray-600 border-0'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { accessToken, isLoading: authLoading } = useAuth()

  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const userId = params.id as string

  useEffect(() => {
    const fetchUser = async () => {
      if (!accessToken || !userId) return

      try {
        const response = await fetch(`${apiUrl}/api/v1/admin/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch user')
        }

        setUser(data.user)
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    if (accessToken) {
      fetchUser()
    }
  }, [accessToken, userId])

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#4379EE] border-r-transparent"></div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error || 'User not found'}</p>
        <button
          onClick={() => router.push('/admin/users')}
          className="text-[#4379EE] hover:text-[#3568d4] font-medium"
        >
          ← Back to Users
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-[#4379EE] hover:text-[#3568d4] font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Users
      </Link>

      {/* User Header Card */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#4379EE] text-xl font-semibold text-white">
            {user.email.charAt(0).toUpperCase()}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-[#202224] truncate">
                {user.email}
              </h1>
              <Badge className={getRoleBadgeStyle(user.role)}>{user.role}</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm">
                  {user.emailVerified ? 'Verified' : 'Not Verified'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm">Joined {formatDate(user.createdAt)}</span>
              </div>
              {user.oauthProvider && (
                <div className="flex items-center gap-2 text-gray-600">
                  <UserIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm capitalize">{user.oauthProvider}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <Package className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{user.orders.length} orders</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Verification Section */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-[#4379EE]" />
          <h2 className="text-lg font-semibold text-[#202224]">Student Verification</h2>
        </div>

        {user.studentVerification ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Status:</span>
              <Badge className={verificationStatusColors[user.studentVerification.status]}>
                {user.studentVerification.status}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Method:</span>
                <span className="ml-2 text-gray-700">{user.studentVerification.verificationMethod}</span>
              </div>
              <div>
                <span className="text-gray-400">Submitted:</span>
                <span className="ml-2 text-gray-700">{formatDate(user.studentVerification.createdAt)}</span>
              </div>
              {user.studentVerification.verifiedAt && (
                <div>
                  <span className="text-gray-400">Verified:</span>
                  <span className="ml-2 text-gray-700">{formatDate(user.studentVerification.verifiedAt)}</span>
                </div>
              )}
              {user.studentVerification.verifiedBy && (
                <div>
                  <span className="text-gray-400">Verified By:</span>
                  <span className="ml-2 text-gray-700">{user.studentVerification.verifiedBy.email}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-gray-500">No student verification submitted</p>
          </div>
        )}
      </div>

      {/* Orders Section */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-[#4379EE]" />
          <h2 className="text-lg font-semibold text-[#202224]">Order History</h2>
        </div>

        {user.orders.length > 0 ? (
          <div className="space-y-4">
            {user.orders.map((order) => (
              <div
                key={order.id}
                className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-[#202224]">
                      Order #{order.id.slice(0, 8)}
                    </span>
                    <Badge className={orderStatusColors[order.status] || 'bg-gray-100 text-gray-800'}>
                      {order.status}
                    </Badge>
                  </div>
                  <span className="text-lg font-bold text-[#202224]">
                    ${parseFloat(order.total).toFixed(2)}
                  </span>
                </div>

                <p className="text-sm text-gray-500 mb-3">
                  Placed on {formatDateTime(order.placedAt)}
                </p>

                {/* Order Items */}
                <div className="space-y-2">
                  {order.items.map((item) => {
                    const imageUrl =
                      Array.isArray(item.product.imageUrls) && item.product.imageUrls.length > 0
                        ? item.product.imageUrls[0]!
                        : '/placeholder.png'

                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 py-2 border-t border-gray-50"
                      >
                        <div className="relative w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                          <Image
                            src={imageUrl}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Qty: {item.quantity} × ${parseFloat(item.price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No orders yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
