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

const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/

const poolSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  startIp: z.string().regex(ipRegex, 'Invalid IP address'),
  endIp: z.string().regex(ipRegex, 'Invalid IP address'),
  cidr: z.number().int().min(1).max(32),
  gateway: z.string().regex(ipRegex, 'Invalid gateway address'),
})

type PoolFormData = z.infer<typeof poolSchema>

export interface IpPoolRow {
  id: string
  name: string
  startIp: string
  endIp: string
  cidr: number
  gateway: string
  allocationCount: number
  createdAt: string
  updatedAt: string
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface IpPoolFormProps {
  open: boolean
  pool: IpPoolRow | null
  accessToken?: string | null
  onSuccess: () => void
  onCancel: () => void
}

export function IpPoolForm({ open, pool, accessToken, onSuccess, onCancel }: IpPoolFormProps) {
  const isEditing = !!pool

  const form = useForm<PoolFormData>({
    resolver: zodResolver(poolSchema),
    defaultValues: {
      name: '',
      startIp: '',
      endIp: '',
      cidr: 24,
      gateway: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (pool) {
        form.reset({
          name: pool.name,
          startIp: pool.startIp,
          endIp: pool.endIp,
          cidr: pool.cidr,
          gateway: pool.gateway,
        })
      } else {
        form.reset({
          name: '',
          startIp: '',
          endIp: '',
          cidr: 24,
          gateway: '',
        })
      }
    }
  }, [open, pool, form])

  const onSubmit = async (data: PoolFormData) => {
    try {
      const url = isEditing
        ? `${apiUrl}/api/v1/ip-pool/${pool!.id}`
        : `${apiUrl}/api/v1/ip-pool`

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
        alert(err.error || 'Failed to save IP pool')
      }
    } catch (error) {
      console.error('Failed to save IP pool:', error)
      alert('Failed to save IP pool')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit IP Pool' : 'Create IP Pool'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the IP pool configuration.' : 'Define a new IP address pool for VM provisioning.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pool Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Production Pool" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startIp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start IP</FormLabel>
                    <FormControl>
                      <Input placeholder="10.0.0.10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endIp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End IP</FormLabel>
                    <FormControl>
                      <Input placeholder="10.0.0.254" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="cidr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CIDR</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={32}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 24)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gateway"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gateway</FormLabel>
                    <FormControl>
                      <Input placeholder="10.0.0.1" {...field} />
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
                {isEditing ? 'Save Changes' : 'Create Pool'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
