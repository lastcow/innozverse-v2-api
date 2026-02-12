'use client'

import { Pencil, Trash2, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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

function ProductThumbnail({ product }: { product: Product }) {
  const imageUrls = product.imageUrls as string[]
  const firstImage = imageUrls?.[0]

  if (firstImage) {
    return (
      <div className="w-12 h-12 rounded-md border border-gray-200 p-0.5 shrink-0">
        <img
          src={firstImage}
          alt={product.name}
          className="w-full h-full rounded-sm object-contain"
        />
      </div>
    )
  }

  return (
    <div className="flex w-12 h-12 items-center justify-center rounded-md border border-gray-200 shrink-0">
      <Package className="w-5 h-5 text-gray-400" />
    </div>
  )
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
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50/80">
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">
              Product
            </th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">
              Type
            </th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">
              Price
            </th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">
              Stock
            </th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">
              Status
            </th>
            <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const stockStatus = getStockStatus(product.stock)
            const upc = (product as Product & { upc?: string }).upc
            return (
              <tr
                key={product.id}
                className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <ProductThumbnail product={product} />
                    <div className="flex flex-col min-w-0">
                      <p className="font-medium text-gray-900 truncate">{product.name}</p>
                      {upc && (
                        <p className="text-xs text-muted-foreground truncate">UPC: {upc}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <Badge className={getProductTypeBadge(product.type)}>
                    {product.type}
                  </Badge>
                </td>
                <td className="px-5 py-4 font-medium text-[#202224]">
                  ${Number(product.basePrice).toFixed(2)}
                </td>
                <td className="px-5 py-4 text-gray-500 text-sm">
                  {product.stock} units
                </td>
                <td className="px-5 py-4">
                  <Badge className={stockStatus.color}>
                    {stockStatus.label}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-right">
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
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
