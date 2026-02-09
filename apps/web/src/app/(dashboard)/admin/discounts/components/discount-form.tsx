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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import type { EventDiscount } from '@repo/types'

const discountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be less than 200 characters'),
  description: z.string().max(5000, 'Description must be less than 5000 characters').optional(),
  percentage: z.number().min(0, 'Percentage must be at least 0').max(100, 'Percentage must be at most 100'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  active: z.boolean(),
}).refine((data) => {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  return end > start
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
})

type DiscountFormData = z.infer<typeof discountSchema>

interface DiscountFormProps {
  open: boolean
  discount: EventDiscount | null
  onSuccess: () => void
  onCancel: () => void
}

const formatDateForInput = (date: Date | string) => {
  const d = new Date(date)
  return d.toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:mm
}

const getTomorrowDate = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  return formatDateForInput(tomorrow)
}

const getNextWeekDate = () => {
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  nextWeek.setHours(23, 59, 0, 0)
  return formatDateForInput(nextWeek)
}

export function DiscountForm({ open, discount, onSuccess, onCancel }: DiscountFormProps) {
  const isEditing = !!discount

  const form = useForm<DiscountFormData>({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      name: '',
      description: '',
      percentage: 10,
      startDate: getTomorrowDate(),
      endDate: getNextWeekDate(),
      active: true,
    },
  })

  useEffect(() => {
    if (discount) {
      form.reset({
        name: discount.name,
        description: discount.description || '',
        percentage: Number(discount.percentage),
        startDate: formatDateForInput(discount.startDate),
        endDate: formatDateForInput(discount.endDate),
        active: discount.active,
      })
    } else {
      form.reset({
        name: '',
        description: '',
        percentage: 10,
        startDate: getTomorrowDate(),
        endDate: getNextWeekDate(),
        active: true,
      })
    }
  }, [discount, form])

  const onSubmit = async (data: DiscountFormData) => {
    try {
      const payload = {
        name: data.name,
        description: data.description || null,
        percentage: data.percentage,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        active: data.active,
      }

      const url = isEditing ? `/api/discounts/${discount.id}` : '/api/discounts'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const error = await response.json()
        alert(`Failed to ${isEditing ? 'update' : 'create'} discount: ${error.error}`)
      }
    } catch {
      alert(`Failed to ${isEditing ? 'update' : 'create'} discount`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#202224]">
            {isEditing ? 'Edit Discount' : 'Add New Discount'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the discount information below'
              : 'Fill in the details to create a new event discount'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Black Friday Sale" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the discount event..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount Percentage (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="10"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter a value between 0 and 100
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === 'true')}
                    value={field.value ? 'true' : 'false'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Enable this discount to apply to products
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
                type="submit"
                className="bg-[#4379EE] hover:bg-[#3568d4] text-white rounded-xl"
              >
                {isEditing ? 'Update Discount' : 'Create Discount'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
