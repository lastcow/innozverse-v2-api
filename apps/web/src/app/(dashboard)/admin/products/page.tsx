'use client'

import { useState, useEffect, useMemo } from 'react'
import { PackagePlus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductTable } from './components/product-table'
import { ProductForm } from './components/product-form'
import { ProductSearch } from './components/product-search'
import { ProductFilters } from './components/product-filters'
import type { Product } from '@repo/database'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  // Client-side search, filters, pagination
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(20)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setIsFormOpen(true)
  }

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchProducts()
      } else {
        alert('Failed to delete product')
      }
    } catch (error) {
      console.error('Failed to delete product:', error)
      alert('Failed to delete product')
    }
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setEditingProduct(null)
    fetchProducts()
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setEditingProduct(null)
  }

  // Client-side filtering
  const filteredProducts = useMemo(() => {
    let result = products

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((p) => p.name.toLowerCase().includes(q))
    }

    if (typeFilter !== 'all') {
      result = result.filter((p) => p.type === typeFilter)
    }

    if (stockFilter === 'in_stock') {
      result = result.filter((p) => p.stock >= 10)
    } else if (stockFilter === 'low_stock') {
      result = result.filter((p) => p.stock > 0 && p.stock < 10)
    } else if (stockFilter === 'out_of_stock') {
      result = result.filter((p) => p.stock === 0)
    }

    return result
  }, [products, searchQuery, typeFilter, stockFilter])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, typeFilter, stockFilter])

  // Pagination logic
  const total = filteredProducts.length
  const totalPages = Math.ceil(total / rowsPerPage) || 1
  const start = (currentPage - 1) * rowsPerPage
  const paginatedProducts = filteredProducts.slice(start, start + rowsPerPage)
  const hasPrev = currentPage > 1
  const hasNext = currentPage < totalPages
  const rangeStart = total > 0 ? start + 1 : 0
  const rangeEnd = Math.min(start + rowsPerPage, total)

  const handleLimitChange = (newLimit: number) => {
    setRowsPerPage(newLimit)
    setCurrentPage(1)
  }

  // Stats (from all products, not filtered)
  const inStock = products.filter((p) => p.stock > 0).length
  const outOfStock = products.filter((p) => p.stock === 0).length

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#202224]">
          Product Inventory
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage products that appear on the storefront
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-400 font-medium">Total Products</p>
          <p className="text-2xl font-bold text-[#202224] mt-1">{total}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-400 font-medium">In Stock</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{inStock}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-400 font-medium">Out of Stock</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{outOfStock}</p>
        </div>
      </div>

      {/* Search, Filter, and Add Product Row */}
      <div className="flex items-center gap-4 mb-6">
        <ProductSearch value={searchQuery} onChange={setSearchQuery} />
        <ProductFilters
          currentType={typeFilter}
          currentStock={stockFilter}
          onTypeChange={setTypeFilter}
          onStockChange={setStockFilter}
        />
        <div className="ml-auto">
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-[#4379EE] hover:bg-[#3568d4] text-white rounded-xl px-5"
            size="lg"
          >
            <PackagePlus className="w-5 h-5 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Product Table Card — Board Style */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <ProductTable
          products={paginatedProducts}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Footer: Pagination */}
        <div className="border-t border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Rows per page */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="h-8 rounded-md border border-gray-200 bg-white px-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#4379EE]"
              >
                {[10, 20, 50, 100].map((val) => (
                  <option key={val} value={val}>
                    {val}
                  </option>
                ))}
              </select>
            </div>

            {/* Right: Page info + navigation */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                {total > 0 ? `${rangeStart}-${rangeEnd} of ${total}` : '0 results'}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={!hasPrev}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                    hasPrev ? 'text-gray-500 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => p - 1)}
                  disabled={!hasPrev}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                    hasPrev ? 'text-gray-500 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-sm font-medium text-gray-700 px-2">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={!hasNext}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                    hasNext ? 'text-gray-500 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={!hasNext}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                    hasNext ? 'text-gray-500 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Form Dialog */}
      <ProductForm
        open={isFormOpen}
        product={editingProduct}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    </div>
  )
}
