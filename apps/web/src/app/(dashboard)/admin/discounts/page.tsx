'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DiscountTable } from './components/discount-table'
import { DiscountForm } from './components/discount-form'
import type { EventDiscount } from '@repo/types'

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<EventDiscount[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState<EventDiscount | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDiscounts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/discounts')
      if (response.ok) {
        const data = await response.json()
        setDiscounts(data)
      }
    } catch {
      // Error fetching discounts
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDiscounts()
  }, [])

  const handleEdit = (discount: EventDiscount) => {
    setEditingDiscount(discount)
    setIsFormOpen(true)
  }

  const handleDelete = async (discountId: string) => {
    if (!confirm('Are you sure you want to delete this discount?')) return

    try {
      const response = await fetch(`/api/discounts/${discountId}`, {
        method: 'DELETE',
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
      const response = await fetch(`/api/discounts/${discountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    </div>
  )
}
