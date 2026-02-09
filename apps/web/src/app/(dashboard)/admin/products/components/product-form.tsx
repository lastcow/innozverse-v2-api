'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, Trash2, Image } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
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
} from '@/components/ui/form'
import type { Product } from '@repo/database'

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.enum(['SURFACE', 'LAPTOP', 'XBOX']),
  basePrice: z.number().min(0.01, 'Price must be greater than 0'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  properties: z.array(
    z.object({
      key: z.string().min(1, 'Key is required'),
      value: z.string().min(1, 'Value is required'),
    })
  ),
  imageUrls: z.array(z.string().url('Must be a valid URL')),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductFormProps {
  open: boolean
  product: Product | null
  onSuccess: () => void
  onCancel: () => void
}

export function ProductForm({ open, product, onSuccess, onCancel }: ProductFormProps) {
  const isEditing = !!product

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'LAPTOP',
      basePrice: 0,
      stock: 0,
      properties: [],
      imageUrls: [],
    },
  })

  useEffect(() => {
    if (product) {
      const properties = Object.entries(product.properties as Record<string, any> || {}).map(
        ([key, value]) => ({
          key,
          value: String(value),
        })
      )

      form.reset({
        name: product.name,
        description: product.description,
        type: product.type as 'SURFACE' | 'LAPTOP' | 'XBOX',
        basePrice: Number(product.basePrice),
        stock: product.stock,
        properties,
        imageUrls: (product.imageUrls as string[]) || [],
      })
    } else {
      form.reset({
        name: '',
        description: '',
        type: 'LAPTOP',
        basePrice: 0,
        stock: 0,
        properties: [],
        imageUrls: [],
      })
    }
  }, [product, form])

  const onSubmit = async (data: ProductFormData) => {
    try {
      const propertiesObj = data.properties.reduce(
        (acc, { key, value }) => {
          acc[key] = value
          return acc
        },
        {} as Record<string, string>
      )

      const payload = {
        name: data.name,
        description: data.description,
        type: data.type,
        basePrice: data.basePrice,
        stock: data.stock,
        properties: propertiesObj,
        active: true,
        imageUrls: data.imageUrls,
      }

      const url = isEditing ? `/api/products/${product.id}` : '/api/products'
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
        alert(`Failed to ${isEditing ? 'update' : 'create'} product: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to submit product:', error)
      alert(`Failed to ${isEditing ? 'update' : 'create'} product`)
    }
  }

  const addProperty = () => {
    const currentProperties = form.getValues('properties')
    form.setValue('properties', [...currentProperties, { key: '', value: '' }])
  }

  const removeProperty = (index: number) => {
    const currentProperties = form.getValues('properties')
    form.setValue(
      'properties',
      currentProperties.filter((_, i) => i !== index)
    )
  }

  const addImageUrl = () => {
    const currentImageUrls = form.getValues('imageUrls')
    form.setValue('imageUrls', [...currentImageUrls, ''])
  }

  const removeImageUrl = (index: number) => {
    const currentImageUrls = form.getValues('imageUrls')
    form.setValue(
      'imageUrls',
      currentImageUrls.filter((_, i) => i !== index)
    )
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#202224]">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the product information below'
              : 'Fill in the details to create a new product'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Surface Pro 9" {...field} />
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
                      placeholder="Describe the product features and benefits..."
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SURFACE">Surface</SelectItem>
                        <SelectItem value="LAPTOP">Laptop</SelectItem>
                        <SelectItem value="XBOX">Xbox</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="basePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Price ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="999.99"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="50"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Product Specifications</Label>
                <Button
                  type="button"
                  onClick={addProperty}
                  variant="outline"
                  size="sm"
                  className="border-gray-200 text-[#4379EE] hover:bg-blue-50"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Spec
                </Button>
              </div>

              <div className="space-y-3 border border-gray-100 rounded-xl p-4 bg-[#F9FAFB]">
                {form.watch('properties').length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No specifications added yet. Click &ldquo;Add Spec&rdquo; to start.
                  </p>
                ) : (
                  form.watch('properties').map((_, index) => (
                    <div key={index} className="flex gap-2">
                      <FormField
                        control={form.control}
                        name={`properties.${index}.key`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Key (e.g., RAM)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`properties.${index}.value`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Value (e.g., 16GB)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => removeProperty(index)}
                        className="w-9 h-9 shrink-0 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Product Images</Label>
                <Button
                  type="button"
                  onClick={addImageUrl}
                  variant="outline"
                  size="sm"
                  className="border-gray-200 text-[#4379EE] hover:bg-blue-50"
                >
                  <Image className="w-4 h-4 mr-1" />
                  Add Image URL
                </Button>
              </div>

              <div className="space-y-3 border border-gray-100 rounded-xl p-4 bg-[#F9FAFB]">
                {form.watch('imageUrls').length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No images added yet. Click &ldquo;Add Image URL&rdquo; to start.
                  </p>
                ) : (
                  form.watch('imageUrls').map((_, index) => (
                    <div key={index} className="flex gap-2">
                      <FormField
                        control={form.control}
                        name={`imageUrls.${index}`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="https://example.com/image.jpg" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => removeImageUrl(index)}
                        className="w-9 h-9 shrink-0 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

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
                {isEditing ? 'Update Product' : 'Create Product'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
