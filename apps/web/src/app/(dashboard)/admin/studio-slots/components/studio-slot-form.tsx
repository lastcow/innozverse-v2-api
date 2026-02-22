'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import type { StudioSlotRow } from './studio-slot-table'

const slotSchema = z
  .object({
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1'),
    isAvailable: z.boolean(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startTime)
      const end = new Date(data.endTime)
      return end > start
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  )

type SlotFormData = z.infer<typeof slotSchema>

interface StudioSlotFormProps {
  open: boolean
  slot: StudioSlotRow | null
  onSubmit: (data: SlotFormData) => Promise<void>
  onCancel: () => void
}

const formatDateForInput = (date: Date | string) => {
  const d = new Date(date)
  return d.toISOString().slice(0, 16)
}

const getDefaultStart = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(10, 0, 0, 0)
  return formatDateForInput(d)
}

const getDefaultEnd = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(12, 0, 0, 0)
  return formatDateForInput(d)
}

export function StudioSlotForm({ open, slot, onSubmit, onCancel }: StudioSlotFormProps) {
  const isEditing = !!slot

  const form = useForm<SlotFormData>({
    resolver: zodResolver(slotSchema),
    defaultValues: {
      startTime: getDefaultStart(),
      endTime: getDefaultEnd(),
      capacity: 10,
      isAvailable: true,
    },
  })

  useEffect(() => {
    if (slot) {
      form.reset({
        startTime: formatDateForInput(slot.startTime),
        endTime: formatDateForInput(slot.endTime),
        capacity: slot.capacity,
        isAvailable: slot.isAvailable,
      })
    } else {
      form.reset({
        startTime: getDefaultStart(),
        endTime: getDefaultEnd(),
        capacity: 10,
        isAvailable: true,
      })
    }
  }, [slot, form])

  const handleSubmit = async (data: SlotFormData) => {
    await onSubmit(data)
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/80"
          onClick={onCancel}
        />
      )}
      <Dialog open={open} onOpenChange={(o) => !o && onCancel()} modal={false}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl z-[51]"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#202224]">
              {isEditing ? 'Edit Studio Slot' : 'Add New Studio Slot'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the time slot details below'
                : 'Create a new open studio time slot'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} placeholder="10" {...field} />
                    </FormControl>
                    <FormDescription>
                      Maximum number of bookings for this slot
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isAvailable"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Availability</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                        value={field.value ? 'true' : 'false'}
                        onChange={(e) => field.onChange(e.target.value === 'true')}
                      >
                        <option value="true">Available (visible to public)</option>
                        <option value="false">Disabled (hidden from public)</option>
                      </select>
                    </FormControl>
                    <FormDescription>
                      Disabled slots won&apos;t appear on the booking page
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="border-gray-200 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={form.handleSubmit(handleSubmit)}
                  className="bg-[#4379EE] hover:bg-[#3568d4] text-white rounded-xl"
                >
                  {isEditing ? 'Update Slot' : 'Create Slot'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}
