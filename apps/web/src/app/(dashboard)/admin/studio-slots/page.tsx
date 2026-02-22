'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { StudioSlotTable, type StudioSlotRow } from './components/studio-slot-table'
import { StudioSlotForm } from './components/studio-slot-form'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function AdminStudioSlotsPage() {
  const { accessToken, isLoading: authLoading } = useAuth()
  const [slots, setSlots] = useState<StudioSlotRow[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<StudioSlotRow | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSlots = useCallback(async () => {
    if (!accessToken) return
    try {
      setLoading(true)
      const res = await fetch(`${apiUrl}/api/v1/studio-slots/admin`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSlots(data.slots)
      } else {
        toast.error('Failed to load studio slots.')
      }
    } catch {
      toast.error('Failed to load studio slots.')
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (accessToken) {
      fetchSlots()
    }
  }, [accessToken, fetchSlots])

  const handleEdit = (slot: StudioSlotRow) => {
    setEditingSlot(slot)
    setIsFormOpen(true)
  }

  const handleDelete = async (slotId: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/studio-slots/${slotId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (res.ok) {
        toast.success('Slot deleted.')
        fetchSlots()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete slot.')
      }
    } catch {
      toast.error('Failed to delete slot.')
    }
  }

  const handleToggleAvailability = async (slotId: string, isAvailable: boolean) => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/studio-slots/${slotId}/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ isAvailable }),
      })

      if (res.ok) {
        toast.success(isAvailable ? 'Slot enabled.' : 'Slot disabled.')
        fetchSlots()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update slot.')
      }
    } catch {
      toast.error('Failed to update slot.')
    }
  }

  const handleFormSubmit = async (data: {
    startTime: string
    endTime: string
    capacity: number
    isAvailable: boolean
  }) => {
    try {
      const url = editingSlot
        ? `${apiUrl}/api/v1/studio-slots/${editingSlot.id}`
        : `${apiUrl}/api/v1/studio-slots`
      const method = editingSlot ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        toast.success(editingSlot ? 'Slot updated.' : 'Slot created.')
        setIsFormOpen(false)
        setEditingSlot(null)
        fetchSlots()
      } else {
        const result = await res.json()
        toast.error(result.error || 'Something went wrong.')
      }
    } catch {
      toast.error('Something went wrong.')
    }
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setEditingSlot(null)
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
          <h1 className="text-2xl font-bold text-[#202224]">Open Studio Slots</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage open studio time slots and bookings
          </p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-[#4379EE] hover:bg-[#3568d4] text-white rounded-xl px-5"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Slot
        </Button>
      </div>

      {/* Slot Table Card */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <StudioSlotTable
          slots={slots}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleAvailability={handleToggleAvailability}
        />
      </div>

      {/* Slot Form Dialog */}
      <StudioSlotForm
        open={isFormOpen}
        slot={editingSlot}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
      />
    </div>
  )
}
