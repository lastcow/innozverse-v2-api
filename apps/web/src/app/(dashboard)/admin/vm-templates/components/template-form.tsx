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
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const templateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  osType: z.string().min(1, 'OS type is required'),
  vmid: z.number().int().min(1, 'VMID must be a positive integer'),
  active: z.boolean(),
})

type TemplateFormData = z.infer<typeof templateSchema>

export interface VmTemplateRow {
  id: string
  vmid: number
  osType: string
  name: string
  active: boolean
  createdAt: string
  updatedAt: string
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface TemplateFormProps {
  open: boolean
  template: VmTemplateRow | null
  accessToken?: string | null
  onSuccess: () => void
  onCancel: () => void
}

export function TemplateForm({ open, template, accessToken, onSuccess, onCancel }: TemplateFormProps) {
  const isEditing = !!template

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      osType: '',
      vmid: 0,
      active: true,
    },
  })

  useEffect(() => {
    if (open) {
      if (template) {
        form.reset({
          name: template.name,
          osType: template.osType,
          vmid: template.vmid,
          active: template.active,
        })
      } else {
        form.reset({
          name: '',
          osType: '',
          vmid: 0,
          active: true,
        })
      }
    }
  }, [open, template, form])

  const onSubmit = async (data: TemplateFormData) => {
    try {
      const url = isEditing
        ? `${apiUrl}/api/v1/vm-templates/${template!.id}`
        : `${apiUrl}/api/v1/vm-templates`

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const err = await response.json()
        alert(err.error || 'Failed to save template')
      }
    } catch (error) {
      console.error('Failed to save template:', error)
      alert('Failed to save template')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Template' : 'Add Template'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the VM template configuration.' : 'Register a new VM template for provisioning.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Ubuntu 24.04 LTS" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="osType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OS Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. ubuntu, kali" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vmid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template VMID</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="e.g. 11001"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#4379EE] hover:bg-[#3568d4] text-white">
                {isEditing ? 'Save Changes' : 'Add Template'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
