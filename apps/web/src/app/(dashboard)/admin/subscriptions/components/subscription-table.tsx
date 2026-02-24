'use client'

import { useState } from 'react'
import { Ban, RotateCcw, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'

export interface Subscription {
  id: string
  userId: string
  planId: string
  stripeSubscriptionId: string | null
  stripeCustomerId: string | null
  status: string
  billingPeriod: string
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  canceledAt: string | null
  createdAt: string
  user: {
    id: string
    email: string
    fname: string | null
    lname: string | null
  }
  plan: {
    id: string
    name: string
    monthlyPrice: number
    annualTotalPrice: number
    level: number
  }
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface SubscriptionTableProps {
  subscriptions: Subscription[]
  pagination: Pagination
  loading: boolean
  onPageChange: (page: number) => void
  onCancel: (subscription: Subscription) => Promise<void>
  onRefund: (subscription: Subscription, amount?: number) => Promise<void>
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-50 text-green-600 border-0',
  PAST_DUE: 'bg-amber-50 text-amber-600 border-0',
  CANCELED: 'bg-red-50 text-red-600 border-0',
  INCOMPLETE: 'bg-gray-50 text-gray-500 border-0',
  TRIALING: 'bg-purple-50 text-purple-600 border-0',
}

export function SubscriptionTable({
  subscriptions,
  pagination,
  loading,
  onPageChange,
  onCancel,
  onRefund,
}: SubscriptionTableProps) {
  const [cancelTarget, setCancelTarget] = useState<Subscription | null>(null)
  const [refundTarget, setRefundTarget] = useState<Subscription | null>(null)
  const [refundAmount, setRefundAmount] = useState('')
  const [isFullRefund, setIsFullRefund] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const handleCancel = async () => {
    if (!cancelTarget) return
    setActionLoading(true)
    try {
      await onCancel(cancelTarget)
    } finally {
      setActionLoading(false)
      setCancelTarget(null)
    }
  }

  const handleRefund = async () => {
    if (!refundTarget) return
    setActionLoading(true)
    try {
      const amount = isFullRefund ? undefined : parseFloat(refundAmount)
      await onRefund(refundTarget, amount)
    } finally {
      setActionLoading(false)
      setRefundTarget(null)
      setRefundAmount('')
      setIsFullRefund(true)
    }
  }

  const openRefundDialog = (sub: Subscription, full: boolean) => {
    setIsFullRefund(full)
    setRefundAmount('')
    setRefundTarget(sub)
  }

  const isPendingCancel = (sub: Subscription) => sub.canceledAt !== null && sub.status === 'ACTIVE'

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#4379EE] border-r-transparent"></div>
        <p className="mt-4 text-gray-500">Loading subscriptions...</p>
      </div>
    )
  }

  if (subscriptions.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500 text-lg">No subscriptions found.</p>
        <p className="text-gray-400 text-sm mt-2">
          Try adjusting your filters.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">User</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">Plan</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">Status</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">Billing</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">Period</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">Amount</th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub) => {
              const amount = sub.billingPeriod === 'annual'
                ? sub.plan.annualTotalPrice
                : sub.plan.monthlyPrice
              const pendingCancel = isPendingCancel(sub)

              return (
                <tr key={sub.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#4379EE]/10 text-[#4379EE] flex items-center justify-center text-xs font-bold shrink-0">
                        {(sub.user.fname?.[0] ?? sub.user.email[0] ?? '?').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {sub.user.fname || sub.user.lname
                            ? `${sub.user.fname || ''} ${sub.user.lname || ''}`.trim()
                            : sub.user.email.split('@')[0]}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{sub.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Badge className="bg-blue-50 text-blue-600 border-0">{sub.plan.name}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <Badge className={statusColors[sub.status] || 'bg-gray-50 text-gray-500 border-0'}>
                        {sub.status}
                      </Badge>
                      {pendingCancel && (
                        <span className="text-[10px] text-amber-600 font-medium">Cancels at period end</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-gray-600 capitalize">{sub.billingPeriod}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-xs text-gray-500">
                      {sub.currentPeriodStart && (
                        <span>{new Date(sub.currentPeriodStart).toLocaleDateString()}</span>
                      )}
                      {sub.currentPeriodStart && sub.currentPeriodEnd && <span> – </span>}
                      {sub.currentPeriodEnd && (
                        <span>{new Date(sub.currentPeriodEnd).toLocaleDateString()}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium text-[#202224]">
                    {amount === 0 ? 'Free' : `$${formatCurrency(amount)}`}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {!pendingCancel && sub.status !== 'CANCELED' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-8 h-8 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 flex items-center justify-center transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setCancelTarget(sub)}>
                            <Ban className="w-4 h-4 mr-2" />
                            Cancel Subscription
                          </DropdownMenuItem>
                          {sub.stripeSubscriptionId && (
                            <>
                              <DropdownMenuItem onClick={() => openRefundDialog(sub, true)}>
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Full Refund
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openRefundDialog(sub, false)}>
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Partial Refund
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
        <p className="text-sm text-gray-500">
          Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Cancel Dialog */}
      <AlertDialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel <strong>{cancelTarget?.user.email}</strong>&apos;s subscription
              to <strong>{cancelTarget?.plan.name}</strong> at the end of their current billing period
              {cancelTarget?.currentPeriodEnd && (
                <> ({new Date(cancelTarget.currentPeriodEnd).toLocaleDateString()})</>
              )}. They will retain access until then.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Refund Dialog */}
      <AlertDialog open={!!refundTarget} onOpenChange={(open) => !open && setRefundTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isFullRefund ? 'Full' : 'Partial'} Refund</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>
                  Issue a {isFullRefund ? 'full' : 'partial'} refund for <strong>{refundTarget?.user.email}</strong>&apos;s
                  latest invoice on the <strong>{refundTarget?.plan.name}</strong> plan.
                </p>
                {!isFullRefund && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Refund Amount ($)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Enter amount"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRefund}
              disabled={actionLoading || (!isFullRefund && (!refundAmount || parseFloat(refundAmount) <= 0))}
              className="bg-[#4379EE] hover:bg-[#3568d4]"
            >
              {actionLoading ? 'Processing...' : `Issue ${isFullRefund ? 'Full' : 'Partial'} Refund`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
