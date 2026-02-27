'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, CheckCircle2, XCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { formatCurrency } from '@/lib/utils'
import { SubscriptionTable, type Subscription, type Pagination } from './components/subscription-table'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface Stats {
  totalActive: number
  totalPastDue: number
  totalSubscriptions: number
  mrr: number
  totalByPlan: Record<string, number>
  totalByStatus: Record<string, number>
}

interface PlanOption {
  id: string
  name: string
}

export default function AdminSubscriptionsPage() {
  const { accessToken, isLoading: authLoading } = useAuth()

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<PlanOption[]>([])

  // Filters
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [billingFilter, setBillingFilter] = useState('')
  const [page, setPage] = useState(1)

  // Info dialog state
  const [infoDialog, setInfoDialog] = useState<{ title: string; message: string; success: boolean } | null>(null)

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch plans for filter dropdown
  useEffect(() => {
    fetch(`${apiUrl}/api/v1/subscriptions/plans?all=true`)
      .then((res) => res.json())
      .then((data) => setPlans(data.plans || []))
      .catch(() => {})
  }, [])

  const fetchSubscriptions = useCallback(async () => {
    if (!accessToken) return
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '10')
      if (planFilter) params.set('plan', planFilter)
      if (statusFilter) params.set('status', statusFilter)
      if (billingFilter) params.set('billingPeriod', billingFilter)
      if (debouncedSearch) params.set('search', debouncedSearch)

      const res = await fetch(`${apiUrl}/api/v1/admin/subscriptions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (res.ok) {
        const data = await res.json()
        setSubscriptions(data.subscriptions)
        setStats(data.stats)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }, [accessToken, page, planFilter, statusFilter, billingFilter, debouncedSearch])

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [planFilter, statusFilter, billingFilter, debouncedSearch])

  const handleProvision = async (sub: Subscription) => {
    if (!accessToken) return
    const res = await fetch(`${apiUrl}/api/v1/admin/subscriptions/${sub.id}/provision`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (res.ok) {
      setInfoDialog({
        title: 'Provisioning Started',
        message: `VM provisioning has been triggered for ${sub.user.email}. VMs will appear shortly once cloning and configuration completes.`,
        success: true,
      })
    } else {
      const err = await res.json().catch(() => ({}))
      setInfoDialog({
        title: 'Provisioning Failed',
        message: (err as { error?: string }).error || 'Failed to trigger VM provisioning. Please try again.',
        success: false,
      })
    }
  }

  const handleCancel = async (sub: Subscription) => {
    if (!accessToken) return
    const res = await fetch(`${apiUrl}/api/v1/admin/subscriptions/${sub.id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (res.ok) {
      await fetchSubscriptions()
    } else {
      const err = await res.json()
      alert(err.error || 'Failed to cancel subscription')
    }
  }

  const handleRefund = async (sub: Subscription, amount?: number) => {
    if (!accessToken) return
    const res = await fetch(`${apiUrl}/api/v1/admin/subscriptions/${sub.id}/refund`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(amount != null ? { amount } : {}),
    })
    if (res.ok) {
      const data = await res.json()
      alert(`Refund of $${formatCurrency(data.refund.amount)} issued successfully.`)
      await fetchSubscriptions()
    } else {
      const err = await res.json()
      alert(err.error || 'Failed to process refund')
    }
  }

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
        <h1 className="text-2xl font-bold text-[#202224]">Subscriptions</h1>
        <p className="text-sm text-gray-500 mt-1">Manage user subscriptions, cancellations, and refunds</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-400 font-medium">Active</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats?.totalActive ?? '–'}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-400 font-medium">Total Subscriptions</p>
          <p className="text-2xl font-bold text-[#4379EE] mt-1">{stats?.totalSubscriptions ?? '–'}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-400 font-medium">MRR</p>
          <p className="text-2xl font-bold text-[#202224] mt-1">
            {stats ? `$${formatCurrency(stats.mrr)}` : '–'}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-400 font-medium">Past Due</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats?.totalPastDue ?? '–'}</p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={planFilter} onValueChange={(v) => setPlanFilter(v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Plans</SelectItem>
            {plans.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'DEFAULT' ? '' : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Excl. Canceled" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DEFAULT">Excl. Canceled</SelectItem>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PAST_DUE">Past Due</SelectItem>
            <SelectItem value="TRIALING">Trialing</SelectItem>
            <SelectItem value="INCOMPLETE">Incomplete</SelectItem>
            <SelectItem value="CANCELED">Canceled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={billingFilter} onValueChange={(v) => setBillingFilter(v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Billing" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Billing</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="annual">Annual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <SubscriptionTable
          subscriptions={subscriptions}
          pagination={pagination}
          loading={loading}
          onPageChange={setPage}
          onCancel={handleCancel}
          onRefund={handleRefund}
          onProvision={handleProvision}
        />
      </div>

      {/* Provision Info Dialog */}
      <Dialog open={!!infoDialog} onOpenChange={(open) => !open && setInfoDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {infoDialog?.success ? (
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
              )}
              <DialogTitle>{infoDialog?.title}</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              {infoDialog?.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setInfoDialog(null)}
              className="bg-[#4379EE] hover:bg-[#3568d4] text-white"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
