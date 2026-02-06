'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Product } from '@repo/database'

interface ProductTableProps {
  products: Product[]
  loading: boolean
  onEdit: (product: Product) => void
  onDelete: (productId: string) => void
}

const getProductTypeBadge = (type: string) => {
  const colors = {
    SURFACE: 'bg-blue-50 text-blue-600 border-0',
    LAPTOP: 'bg-purple-50 text-purple-600 border-0',
    XBOX: 'bg-green-50 text-green-600 border-0',
  }
  return colors[type as keyof typeof colors] || 'bg-gray-50 text-gray-600 border-0'
}

const getStockStatus = (stock: number) => {
  if (stock === 0) {
    return { label: 'Out of Stock', color: 'bg-red-50 text-red-600 border-0' }
  } else if (stock < 10) {
    return { label: 'Low Stock', color: 'bg-amber-50 text-amber-600 border-0' }
  } else {
    return { label: 'In Stock', color: 'bg-green-50 text-green-600 border-0' }
  }
}

export function ProductTable({ products, loading, onEdit, onDelete }: ProductTableProps) {
  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#4379EE] border-r-transparent"></div>
        <p className="mt-4 text-gray-500">Loading products...</p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500 text-lg">No products found.</p>
        <p className="text-gray-400 text-sm mt-2">
          Click &ldquo;Add Product&rdquo; to create your first product.
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-gray-100 hover:bg-transparent">
          <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Name</TableHead>
          <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Type</TableHead>
          <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Price</TableHead>
          <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Stock</TableHead>
          <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Status</TableHead>
          <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => {
          const stockStatus = getStockStatus(product.stock)
          return (
            <TableRow key={product.id} className="border-gray-50 hover:bg-gray-50/50">
              <TableCell className="font-semibold text-[#202224]">{product.name}</TableCell>
              <TableCell>
                <Badge className={getProductTypeBadge(product.type)}>
                  {product.type}
                </Badge>
              </TableCell>
              <TableCell className="font-semibold text-[#202224]">
                ${Number(product.basePrice).toFixed(2)}
              </TableCell>
              <TableCell className="text-gray-500">{product.stock} units</TableCell>
              <TableCell>
                <Badge className={stockStatus.color}>
                  {stockStatus.label}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(product)}
                    className="w-8 h-8 rounded-lg bg-blue-50 text-[#4379EE] hover:bg-blue-100 flex items-center justify-center transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(product.id)}
                    className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
