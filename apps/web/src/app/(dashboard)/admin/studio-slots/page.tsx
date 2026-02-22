'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { StudioSlotTable, type StudioSlotRow } from './components/studio-slot-table'
import { StudioSlotForm } from './components/studio-slot-form'
import {
  getStudioSlots,
  createStudioSlot,
  updateStudioSlot,
  deleteStudioSlot,
  toggleSlotAvailability,
} from '@/app/actions/admin-studio'

export default function AdminStudioSlotsPage() {
  const [slots, setSlots] = useState<StudioSlotRow[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<StudioSlotRow | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSlots = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getStudioSlots()
      setSlots(data)
    } catch {
      toast.error('Failed to load studio slots.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSlots()
  }, [fetchSlots])

  const handleEdit = (slot: StudioSlotRow) => {
    setEditingSlot(slot)
    setIsFormOpen(true)
  }

  const handleDelete = async (slotId: string) => {
    if (!confirm('Are you sure you want to delete this slot? All bookings will be removed.')) return

    const result = await deleteStudioSlot(slotId)
    if (result.success) {
      toast.success('Slot deleted.')
      fetchSlots()
    } else {
      toast.error(result.error || 'Failed to delete slot.')
    }
  }

  const handleToggleAvailability = async (slotId: string, isAvailable: boolean) => {
    const result = await toggleSlotAvailability(slotId, isAvailable)
    if (result.success) {
      toast.success(isAvailable ? 'Slot enabled.' : 'Slot disabled.')
      fetchSlots()
    } else {
      toast.error(result.error || 'Failed to update slot.')
    }
  }

  const handleFormSubmit = async (data: {
    startTime: string
    endTime: string
    capacity: number
    isAvailable: boolean
  }) => {
    const result = editingSlot
      ? await updateStudioSlot(editingSlot.id, data)
      : await createStudioSlot(data)

    if (result.success) {
      toast.success(editingSlot ? 'Slot updated.' : 'Slot created.')
      setIsFormOpen(false)
      setEditingSlot(null)
      fetchSlots()
    } else {
      toast.error(result.error || 'Something went wrong.')
    }
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setEditingSlot(null)
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
