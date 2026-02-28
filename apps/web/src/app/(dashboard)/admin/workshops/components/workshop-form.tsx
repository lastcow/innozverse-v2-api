'use client'

import { useEffect, useRef, useState } from 'react'
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { MultiImageUpload } from '@/components/ui/multi-image-upload'
import type { Workshop } from '@repo/types'

interface AvailableProduct {
  id: string
  name: string
  basePrice: string
  type: string
}

interface ProductSelection {
  productId: string
  quantity: number
}

const workshopSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(1, 'Description is required').max(10000, 'Description must be less than 10000 characters'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  capacity: z.coerce.number().int().min(0, 'Capacity must be 0 or more'),
  isPublished: z.boolean(),
  imageUrls: z.array(z.string()),
  products: z.array(z.object({
    productId: z.string(),
    quantity: z.coerce.number().int().min(1),
  })),
}).refine((data) => {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  return end > start
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
})

type WorkshopFormData = z.infer<typeof workshopSchema>

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface WorkshopFormProps {
  open: boolean
  workshop: Workshop | null
  accessToken?: string | null
  onSuccess: () => void
  onCancel: () => void
}

const formatDateForInput = (date: Date | string) => {
  const d = new Date(date)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const getTomorrowDate = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(9, 0, 0, 0)
  return formatDateForInput(tomorrow)
}

const getNextWeekDate = () => {
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  nextWeek.setHours(17, 0, 0, 0)
  return formatDateForInput(nextWeek)
}

export function WorkshopForm({ open, workshop, accessToken, onSuccess, onCancel }: WorkshopFormProps) {
  const isEditing = !!workshop
  const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([])

  const form = useForm<WorkshopFormData>({
    resolver: zodResolver(workshopSchema),
    defaultValues: {
      title: '',
      description: '',
      startDate: getTomorrowDate(),
      endDate: getNextWeekDate(),
      capacity: 0,
      isPublished: false,
      imageUrls: [],
      products: [],
    },
  })

  useEffect(() => {
    if (!open) return
    fetch(`${apiUrl}/api/v1/products?active=true&limit=100`)
      .then((r) => r.ok ? r.json() : { products: [] })
      .then((data) => setAvailableProducts(data.products || []))
      .catch(() => setAvailableProducts([]))
  }, [open])

  useEffect(() => {
    if (workshop) {
      const images = Array.isArray(workshop.imageUrls)
        ? (workshop.imageUrls as string[])
        : []
      const workshopAny = workshop as Record<string, unknown>
      const existingProducts = Array.isArray(workshopAny.products)
        ? (workshopAny.products as Array<{ id: string; quantity: number }>).map((p) => ({
            productId: p.id,
            quantity: p.quantity,
          }))
        : []
      form.reset({
        title: workshop.title,
        description: workshop.description,
        startDate: formatDateForInput(workshop.startDate),
        endDate: formatDateForInput(workshop.endDate),
        capacity: (workshop as Workshop & { capacity?: number }).capacity ?? 0,
        isPublished: workshop.isPublished,
        imageUrls: images,
        products: existingProducts,
      })
    } else {
      form.reset({
        title: '',
        description: '',
        startDate: getTomorrowDate(),
        endDate: getNextWeekDate(),
        capacity: 0,
        isPublished: false,
        imageUrls: [],
        products: [],
      })
    }
  }, [workshop, form])

  const selectedProducts = form.watch('products')
  const [productSearch, setProductSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredProducts = availableProducts.filter(
    (p) =>
      !selectedProducts.some((sp) => sp.productId === p.id) &&
      p.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  const addProduct = (productId: string) => {
    const current = form.getValues('products')
    form.setValue('products', [...current, { productId, quantity: 1 }], { shouldDirty: true })
    setProductSearch('')
    setDropdownOpen(false)
  }

  const removeProduct = (productId: string) => {
    const current = form.getValues('products')
    form.setValue('products', current.filter((p) => p.productId !== productId), { shouldDirty: true })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    const current = form.getValues('products')
    form.setValue(
      'products',
      current.map((p) => p.productId === productId ? { ...p, quantity: Math.max(1, quantity) } : p),
      { shouldDirty: true }
    )
  }

  const getProductName = (productId: string) => {
    return availableProducts.find((p) => p.id === productId)
  }

  const onSubmit = async (data: WorkshopFormData) => {
    try {
      const payload = {
        title: data.title,
        description: data.description,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        capacity: data.capacity,
        isPublished: data.isPublished,
        imageUrls: data.imageUrls,
        products: data.products,
      }
      const url = isEditing
        ? `${apiUrl}/api/v1/workshops/${workshop.id}`
        : `${apiUrl}/api/v1/workshops`
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const error = await response.json()
        alert(`Failed to ${isEditing ? 'update' : 'create'} workshop: ${error.error}`)
      }
    } catch {
      alert(`Failed to ${isEditing ? 'update' : 'create'} workshop`)
    }
  }

  return (
    <>
      {/* Manual backdrop since modal={false} disables the default overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/80"
          onClick={onCancel}
        />
      )}
      <Dialog open={open} onOpenChange={(open) => !open && onCancel()} modal={false}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl z-[51]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#202224]">
            {isEditing ? 'Edit Workshop' : 'Add New Workshop'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the workshop information below'
              : 'Fill in the details to create a new workshop'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workshop Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Introduction to 3D Printing" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the workshop..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
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
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Number of seats available (0 = unlimited)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                      value={field.value ? 'true' : 'false'}
                      onChange={(e) => field.onChange(e.target.value === 'true')}
                    >
                      <option value="false">Draft (hidden from public)</option>
                      <option value="true">Published (visible to public)</option>
                    </select>
                  </FormControl>
                  <FormDescription>
                    Published workshops are visible on the public page
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Products Section */}
            {availableProducts.length > 0 && (
              <div className="space-y-3">
                <FormLabel>Required Kits / Products (optional)</FormLabel>
                <FormDescription>
                  Search and add products that participants need for this workshop
                </FormDescription>

                {/* Searchable dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <Input
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value)
                      setDropdownOpen(true)
                    }}
                    onFocus={() => setDropdownOpen(true)}
                    className="h-9 text-sm"
                  />
                  {dropdownOpen && filteredProducts.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                      {filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 text-left"
                          onClick={() => addProduct(product.id)}
                        >
                          <span className="truncate">{product.name}</span>
                          <span className="ml-2 shrink-0 text-gray-400">
                            ${Number(product.basePrice).toFixed(2)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {dropdownOpen && productSearch && filteredProducts.length === 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg px-3 py-2 text-sm text-gray-400">
                      No matching products
                    </div>
                  )}
                </div>

                {/* Selected products list */}
                {selectedProducts.length > 0 && (
                  <div className="space-y-2">
                    {selectedProducts.map((sp) => {
                      const product = getProductName(sp.productId)
                      if (!product) return null
                      return (
                        <div key={sp.productId} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                          <span className="flex-1 text-sm truncate">
                            {product.name}
                            <span className="text-gray-400 ml-1">
                              (${Number(product.basePrice).toFixed(2)})
                            </span>
                          </span>
                          <Input
                            type="number"
                            min={1}
                            value={sp.quantity}
                            onChange={(e) => updateQuantity(sp.productId, Number(e.target.value))}
                            className="w-20 h-8 text-sm"
                          />
                          <button
                            type="button"
                            className="text-gray-400 hover:text-red-500 text-lg leading-none px-1"
                            onClick={() => removeProduct(sp.productId)}
                          >
                            &times;
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="imageUrls"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Images</FormLabel>
                  <FormControl>
                    <MultiImageUpload
                      value={field.value}
                      onChange={(urls) => form.setValue('imageUrls', urls, { shouldDirty: true })}
                    />
                  </FormControl>
                  <FormDescription>
                    Upload photos from the workshop
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
                onClick={form.handleSubmit(onSubmit)}
                className="bg-[#4379EE] hover:bg-[#3568d4] text-white rounded-xl"
              >
                {isEditing ? 'Update Workshop' : 'Create Workshop'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}
