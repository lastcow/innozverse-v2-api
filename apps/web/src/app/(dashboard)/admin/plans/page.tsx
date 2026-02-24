'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { PlanTable, type Plan } from './components/plan-table'
import { PlanForm } from './components/plan-form'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function AdminPlansPage() {
  const { accessToken, isLoading: authLoading } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`${apiUrl}/api/v1/subscriptions/plans?all=true`)
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans)
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setIsFormOpen(true)
  }

  const handleDelete = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return

    try {
      const response = await fetch(`${apiUrl}/api/v1/subscriptions/plans/${planId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        await fetchPlans()
      } else {
        const err = await response.json()
        alert(err.error || 'Failed to delete plan')
      }
    } catch (error) {
      console.error('Failed to delete plan:', error)
      alert('Failed to delete plan')
    }
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setEditingPlan(null)
    fetchPlans()
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setEditingPlan(null)
  }

  const activePlans = plans.filter((p) => p.active).length
  const inactivePlans = plans.filter((p) => !p.active).length

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
          Subscription Plans
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage subscription plans available to users
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-400 font-medium">Total Plans</p>
          <p className="text-2xl font-bold text-[#202224] mt-1">{plans.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-400 font-medium">Active</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{activePlans}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-400 font-medium">Inactive</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{inactivePlans}</p>
        </div>
      </div>

      {/* Add Plan Button */}
      <div className="flex items-center justify-end mb-6">
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-[#4379EE] hover:bg-[#3568d4] text-white rounded-xl px-5"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Plan
        </Button>
      </div>

      {/* Plan Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <PlanTable
          plans={plans}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Plan Form Dialog */}
      <PlanForm
        open={isFormOpen}
        plan={editingPlan}
        accessToken={accessToken}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    </div>
  )
}
