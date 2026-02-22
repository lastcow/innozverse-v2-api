'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { WorkshopTable } from './components/workshop-table'
import { WorkshopForm } from './components/workshop-form'
import type { Workshop } from '@repo/types'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function AdminWorkshopsPage() {
  const { accessToken, isLoading: authLoading } = useAuth()
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchWorkshops = useCallback(async () => {
    if (!accessToken) return
    try {
      setLoading(true)
      const response = await fetch(`${apiUrl}/api/v1/workshops/admin`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setWorkshops(data.workshops)
      }
    } catch {
      // Error fetching workshops
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (accessToken) {
      fetchWorkshops()
    }
  }, [accessToken, fetchWorkshops])

  const handleEdit = (workshop: Workshop) => {
    setEditingWorkshop(workshop)
    setIsFormOpen(true)
  }

  const handleDelete = async (workshopId: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/v1/workshops/${workshopId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        toast.success('Workshop deleted.')
        await fetchWorkshops()
      } else {
        toast.error('Failed to delete workshop')
      }
    } catch {
      toast.error('Failed to delete workshop')
    }
  }

  const handleTogglePublished = async (workshopId: string, isPublished: boolean) => {
    try {
      const response = await fetch(`${apiUrl}/api/v1/workshops/${workshopId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ isPublished }),
      })

      if (response.ok) {
        await fetchWorkshops()
      } else {
        toast.error('Failed to update workshop status')
      }
    } catch {
      alert('Failed to update workshop status')
    }
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setEditingWorkshop(null)
    fetchWorkshops()
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setEditingWorkshop(null)
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
            Workshops
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage workshops and events
          </p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-[#4379EE] hover:bg-[#3568d4] text-white rounded-xl px-5"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Workshop
        </Button>
      </div>

      {/* Workshop Table Card */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <WorkshopTable
          workshops={workshops}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onTogglePublished={handleTogglePublished}
        />
      </div>

      {/* Workshop Form Dialog */}
      <WorkshopForm
        open={isFormOpen}
        workshop={editingWorkshop}
        accessToken={accessToken}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    </div>
  )
}
