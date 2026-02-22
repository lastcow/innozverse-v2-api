'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { DiscountTable } from './components/discount-table'
import { DiscountForm } from './components/discount-form'
import type { EventDiscount } from '@repo/types'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function AdminDiscountsPage() {
  const { accessToken, isLoading: authLoading } = useAuth()
  const [discounts, setDiscounts] = useState<EventDiscount[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState<EventDiscount | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDiscounts = useCallback(async () => {
    if (!accessToken) return
    try {
      setLoading(true)
      const response = await fetch(`${apiUrl}/api/v1/discounts`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setDiscounts(data.discounts)
      }
    } catch {
      // Error fetching discounts
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (accessToken) {
      fetchDiscounts()
    }
  }, [accessToken, fetchDiscounts])

  const handleEdit = (discount: EventDiscount) => {
    setEditingDiscount(discount)
    setIsFormOpen(true)
  }

  const handleDelete = async (discountId: string) => {
    if (!confirm('Are you sure you want to delete this discount?')) return

    try {
      const response = await fetch(`${apiUrl}/api/v1/discounts/${discountId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        await fetchDiscounts()
      } else {
        alert('Failed to delete discount')
      }
    } catch {
      alert('Failed to delete discount')
    }
  }

  const handleToggleActive = async (discountId: string, active: boolean) => {
    try {
      const response = await fetch(`${apiUrl}/api/v1/discounts/${discountId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ active }),
      })

      if (response.ok) {
        await fetchDiscounts()
      } else {
        alert('Failed to update discount status')
      }
    } catch {
      alert('Failed to update discount status')
    }
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setEditingDiscount(null)
    fetchDiscounts()
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setEditingDiscount(null)
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#202224]">
            Event Discounts
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage promotional discounts for all products
          </p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-[#4379EE] hover:bg-[#3568d4] text-white rounded-xl px-5"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Discount
        </Button>
      </div>

      {/* Discount Table Card */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <DiscountTable
          discounts={discounts}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
        />
      </div>

      {/* Discount Form Dialog */}
      <DiscountForm
        open={isFormOpen}
        discount={editingDiscount}
        accessToken={accessToken}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    </div>
  )
}
