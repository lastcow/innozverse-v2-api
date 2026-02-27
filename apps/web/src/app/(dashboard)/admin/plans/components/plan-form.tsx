'use client'

import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, Trash2 } from 'lucide-react'
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Plan } from './plan-table'

const vmSpecSchema = z.object({
  template: z.enum(['ubuntu', 'kali']),
  cores: z.number().int().min(1),
  memory: z.number().int().min(256),
  diskSize: z.number().int().min(1).optional(),
})

const planSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  level: z.number().int().min(0, 'Level must be 0 or higher'),
  monthlyPrice: z.number().min(0, 'Price cannot be negative'),
  description: z.string().min(1, 'Description is required'),
  highlights: z.array(z.object({ value: z.string().min(1, 'Highlight is required') })).min(1, 'At least one highlight'),
  vmSpecs: z.array(vmSpecSchema),
  active: z.boolean(),
  sortOrder: z.number().int().min(0),
})

type PlanFormData = z.infer<typeof planSchema>

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface PlanFormProps {
  open: boolean
  plan: Plan | null
  accessToken?: string | null
  onSuccess: () => void
  onCancel: () => void
}

export function PlanForm({ open, plan, accessToken, onSuccess, onCancel }: PlanFormProps) {
  const isEditing = !!plan

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: '',
      level: 0,
      monthlyPrice: 0,
      description: '',
      highlights: [{ value: '' }],
      vmSpecs: [],
      active: true,
      sortOrder: 0,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'highlights',
  })

  const { fields: vmFields, append: appendVm, remove: removeVm } = useFieldArray({
    control: form.control,
    name: 'vmSpecs',
  })

  useEffect(() => {
    if (open) {
      if (plan) {
        const hl = (plan.highlights as string[]) || []
        const vm = Array.isArray(plan.vmConfig) ? plan.vmConfig : []
        form.reset({
          name: plan.name,
          level: plan.level,
          monthlyPrice: Number(plan.monthlyPrice) || 0,
          description: plan.description,
          highlights: hl.length > 0 ? hl.map((v) => ({ value: v })) : [{ value: '' }],
          vmSpecs: vm.map((s) => ({
            template: s.template,
            cores: s.cores,
            memory: s.memory,
            diskSize: s.diskSize,
          })),
          active: plan.active,
          sortOrder: plan.sortOrder,
        })
      } else {
        form.reset({
          name: '',
          level: 0,
          monthlyPrice: 0,
          description: '',
          highlights: [{ value: '' }],
          vmSpecs: [],
          active: true,
          sortOrder: 0,
        })
      }
    }
  }, [open, plan, form])

  const onSubmit = async (data: PlanFormData) => {
    const annualTotalPrice = Math.round(data.monthlyPrice * 12 * 100) / 100
    const vmConfig = data.vmSpecs.map((s) => {
      const spec: Record<string, unknown> = { template: s.template, cores: s.cores, memory: s.memory }
      if (s.diskSize) spec.diskSize = s.diskSize
      return spec
    })
    const payload = {
      name: data.name,
      level: data.level,
      monthlyPrice: data.monthlyPrice,
      annualTotalPrice,
      description: data.description,
      highlights: data.highlights.map((h) => h.value),
      vmConfig,
      active: data.active,
      sortOrder: data.sortOrder,
    }

    try {
      const url = isEditing
        ? `${apiUrl}/api/v1/subscriptions/plans/${plan!.id}`
        : `${apiUrl}/api/v1/subscriptions/plans`

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const err = await response.json()
        alert(err.error || 'Failed to save plan')
      }
    } catch (error) {
      console.error('Failed to save plan:', error)
      alert('Failed to save plan')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Plan' : 'Add Plan'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the subscription plan details.' : 'Create a new subscription plan.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name + Level */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Basic" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Price */}
            <FormField
              control={form.control}
              name="monthlyPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Price ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      {...field}
                      value={field.value}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Plan description..." rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Highlights */}
            <div>
              <FormLabel>Highlights</FormLabel>
              <div className="space-y-2 mt-1.5">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`highlights.${index}.value`}
                      render={({ field: inputField }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="e.g. 2 Standard VMs" {...inputField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ value: '' })}
                  className="text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Highlight
                </Button>
              </div>
            </div>

            {/* VM Configuration */}
            <div>
              <FormLabel>VM Configuration</FormLabel>
              <p className="text-xs text-gray-400 mb-2">VMs auto-provisioned when a user subscribes to this plan.</p>
              <div className="space-y-3 mt-1.5">
                {vmFields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-4 gap-2 flex-1">
                      <FormField
                        control={form.control}
                        name={`vmSpecs.${index}.template`}
                        render={({ field: f }) => (
                          <FormItem>
                            <Select value={f.value} onValueChange={f.onChange}>
                              <FormControl>
                                <SelectTrigger className="h-9 text-xs">
                                  <SelectValue placeholder="Template" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ubuntu">Ubuntu</SelectItem>
                                <SelectItem value="kali">Kali</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`vmSpecs.${index}.cores`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                placeholder="Cores"
                                className="h-9 text-xs"
                                {...f}
                                onChange={(e) => f.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`vmSpecs.${index}.memory`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                min={256}
                                step={256}
                                placeholder="RAM (MB)"
                                className="h-9 text-xs"
                                {...f}
                                onChange={(e) => f.onChange(parseInt(e.target.value) || 512)}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`vmSpecs.${index}.diskSize`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                placeholder="Disk (GB)"
                                className="h-9 text-xs"
                                value={f.value ?? ''}
                                onChange={(e) => {
                                  const v = e.target.value
                                  f.onChange(v ? parseInt(v) : undefined)
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVm(index)}
                      className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors shrink-0 mt-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendVm({ template: 'ubuntu', cores: 2, memory: 2048 })}
                  className="text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add VM
                </Button>
              </div>
            </div>

            {/* Active + Sort Order */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={field.value ? 'true' : 'false'}
                      onValueChange={(v) => field.onChange(v === 'true')}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#4379EE] hover:bg-[#3568d4] text-white">
                {isEditing ? 'Save Changes' : 'Create Plan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
