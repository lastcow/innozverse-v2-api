'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Cpu, Monitor, Gamepad2, Loader2, Tag, Percent } from 'lucide-react'
import Link from 'next/link'
import type { EventDiscount } from '@repo/types'
import {
  calculateDiscountBreakdown,
  getActiveEventDiscount,
  formatDiscountPercentage,
} from '@/lib/discount'

type ProductType = 'SURFACE' | 'LAPTOP' | 'XBOX'
type CategoryFilter = 'all' | ProductType

interface Product {
  id: string
  name: string
  description: string
  type: ProductType
  basePrice: number
  stock: number
  active: boolean
  properties: Record<string, unknown>
  imageUrls: string[]
  studentDiscountPercentage: number | null
  createdAt: string
  updatedAt: string
}

interface ApiResponse {
  products: Product[]
  activeEventDiscounts: EventDiscount[]
}

const categories: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'SURFACE', label: 'Surface' },
  { value: 'LAPTOP', label: 'Laptops' },
  { value: 'XBOX', label: 'Xbox' },
]

const getCategoryIcon = (type: ProductType) => {
  switch (type) {
    case 'SURFACE':
      return <Monitor className="w-16 h-16 text-stone-400 mx-auto mb-2" />
    case 'LAPTOP':
      return <Cpu className="w-16 h-16 text-stone-400 mx-auto mb-2" />
    case 'XBOX':
      return <Gamepad2 className="w-16 h-16 text-stone-400 mx-auto mb-2" />
    default:
      return <Cpu className="w-16 h-16 text-stone-400 mx-auto mb-2" />
  }
}

const getCategoryLabel = (type: ProductType): string => {
  const category = categories.find((c) => c.value === type)
  return category?.label || type
}

const getProductSpecs = (product: Product): string[] => {
  const props = product.properties as Record<string, string | undefined>
  const specs: string[] = []

  if (props.processor) specs.push(props.processor)
  if (props.ram) specs.push(props.ram)
  if (props.storage) specs.push(props.storage)
  if (props.display) specs.push(props.display)
  if (props.graphics) specs.push(props.graphics)

  return specs.slice(0, 3) // Return max 3 specs
}

const getProductTag = (product: Product): string => {
  const props = product.properties as Record<string, string | undefined>
  if (props.tag) return props.tag

  switch (product.type) {
    case 'SURFACE':
      return 'Best for Notes'
    case 'LAPTOP':
      return 'Power User'
    case 'XBOX':
      return 'Gaming'
    default:
      return 'Featured'
  }
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [activeEventDiscounts, setActiveEventDiscounts] = useState<EventDiscount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all')
  const [showStudentPricing, setShowStudentPricing] = useState(false)

  // Get the best active event discount (highest percentage)
  const activeEventDiscount = getActiveEventDiscount(activeEventDiscounts)

  const fetchProducts = async (typeFilter?: ProductType) => {
    try {
      setLoading(true)
      setError(null)
      const url = typeFilter
        ? `/api/products?type=${typeFilter}&activeOnly=true`
        : '/api/products?activeOnly=true'
      const response = await fetch(url)
      if (response.ok) {
        const data: ApiResponse = await response.json()
        setProducts(data.products)
        setActiveEventDiscounts(data.activeEventDiscounts || [])
      } else {
        setError('Failed to load products')
      }
    } catch {
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts(selectedCategory === 'all' ? undefined : selectedCategory)
  }, [selectedCategory])

  const groupedProducts = products.reduce<Record<ProductType, Product[]>>((acc, product) => {
    if (!acc[product.type]) {
      acc[product.type] = []
    }
    acc[product.type].push(product)
    return acc
  }, {} as Record<ProductType, Product[]>)

  return (
    <>
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-stone-50 via-orange-50/30 to-stone-100">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-serif text-5xl sm:text-6xl font-bold text-stone-900 mb-4">
              Tools for Your Journey.
            </h1>
            <p className="text-xl text-stone-600 leading-relaxed">
              Premium hardware to power your studies and downtime. Verified students save up to 40%.
            </p>
          </div>
        </div>
      </section>

      {/* Filter & Toggle Section */}
      <section className="py-8 bg-white border-b-2 border-stone-200">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              {/* Category Filters */}
              <div className="flex flex-wrap gap-3">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className={`px-6 py-2 rounded-full font-medium transition-all ${
                      selectedCategory === category.value
                        ? 'bg-orange-600 text-white shadow-lg'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>

              {/* Student Pricing Toggle */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowStudentPricing(!showStudentPricing)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showStudentPricing ? 'bg-orange-600' : 'bg-stone-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showStudentPricing ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <label
                  className="text-sm font-medium text-stone-900 cursor-pointer"
                  onClick={() => setShowStudentPricing(!showStudentPricing)}
                >
                  Show Student Pricing
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="py-16 bg-white">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
                <span className="ml-2 text-stone-600">Loading products...</span>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-red-600 text-lg">{error}</p>
                <Button
                  onClick={() => fetchProducts(selectedCategory === 'all' ? undefined : selectedCategory)}
                  className="mt-4 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Try Again
                </Button>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-stone-600 text-lg">
                  No products found in this category.
                </p>
              </div>
            ) : selectedCategory === 'all' ? (
              // Grouped by category view
              <div className="space-y-12">
                {(Object.keys(groupedProducts) as ProductType[]).map((type) => (
                  <div key={type}>
                    <h2 className="font-serif text-3xl font-bold text-stone-900 mb-6">
                      {getCategoryLabel(type)}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {groupedProducts[type].map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          showStudentPricing={showStudentPricing}
                          activeEventDiscount={activeEventDiscount}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Single category view
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    showStudentPricing={showStudentPricing}
                    activeEventDiscount={activeEventDiscount}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-orange-50 via-stone-50 to-green-50/30">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="font-serif text-4xl font-bold text-stone-900">
              Not a student yet?
            </h2>
            <p className="text-xl text-stone-600">
              Verify your student status to unlock exclusive discounts on all products.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700 text-white">
                <Link href="/auth/register">Verify Student Status</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-2 border-stone-300 hover:bg-stone-100"
              >
                <Link href="/pricing">View Plans</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

interface ProductCardProps {
  product: Product
  showStudentPricing: boolean
  activeEventDiscount: EventDiscount | null
}

function ProductCard({ product, showStudentPricing, activeEventDiscount }: ProductCardProps) {
  const basePrice = Number(product.basePrice)
  const hasStudentDiscount = product.studentDiscountPercentage && product.studentDiscountPercentage > 0
  const hasEventDiscount = activeEventDiscount !== null && activeEventDiscount.percentage > 0
  const specs = getProductSpecs(product)
  const tag = getProductTag(product)

  // Calculate discount breakdown using utility function
  const studentDiscountPercentage = showStudentPricing && hasStudentDiscount
    ? product.studentDiscountPercentage
    : null
  const eventDiscountPercentage = hasEventDiscount ? activeEventDiscount.percentage : null

  const discountBreakdown = calculateDiscountBreakdown(
    basePrice,
    studentDiscountPercentage,
    eventDiscountPercentage
  )

  const hasAnyDiscount = (showStudentPricing && hasStudentDiscount) || hasEventDiscount
  const finalPrice = discountBreakdown.finalPrice

  return (
    <Card
      className="relative rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-stone-200 hover:border-orange-300 bg-white flex flex-col"
    >
      {/* Product Tag */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
        <Badge className="bg-orange-600 text-white shadow-lg px-4 py-1">
          {tag}
        </Badge>
      </div>

      <CardHeader className="space-y-4 pb-6">
        {/* Product Image or Placeholder */}
        <div className="aspect-square rounded-xl bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center overflow-hidden">
          {product.imageUrls && product.imageUrls.length > 0 ? (
            <img
              src={product.imageUrls[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center">
              {getCategoryIcon(product.type)}
              <p className="text-sm text-stone-400 font-medium">{product.name}</p>
            </div>
          )}
        </div>

        {/* Product Title */}
        <CardTitle className="font-serif text-2xl text-stone-900">
          {product.name}
        </CardTitle>

        {/* Specs */}
        {specs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {specs.map((spec, index) => (
              <Badge
                key={index}
                variant="outline"
                className="border-stone-300 text-stone-700 text-xs"
              >
                {spec}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3 pb-6 flex-grow">
        {/* Discount Badges */}
        {hasAnyDiscount && (
          <div className="flex flex-wrap gap-2">
            {hasEventDiscount && (
              <Badge className="bg-green-600 text-white text-xs px-2 py-0.5 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {activeEventDiscount.name} -{formatDiscountPercentage(activeEventDiscount.percentage)}
              </Badge>
            )}
            {showStudentPricing && hasStudentDiscount && (
              <Badge className="bg-orange-600 text-white text-xs px-2 py-0.5 flex items-center gap-1">
                <Percent className="w-3 h-3" />
                Student -{formatDiscountPercentage(Number(product.studentDiscountPercentage))}
              </Badge>
            )}
          </div>
        )}

        {/* Pricing */}
        <div className="space-y-1">
          {hasAnyDiscount ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-stone-400 line-through text-lg">
                  ${basePrice.toFixed(2)}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-serif text-4xl font-bold text-orange-600">
                  ${finalPrice.toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-green-600 font-medium space-y-0.5">
                {discountBreakdown.studentDiscountAmount > 0 && (
                  <p>
                    Student discount: -${discountBreakdown.studentDiscountAmount.toFixed(2)}
                  </p>
                )}
                {discountBreakdown.eventDiscountAmount > 0 && (
                  <p>
                    Event discount: -${discountBreakdown.eventDiscountAmount.toFixed(2)}
                  </p>
                )}
                <p className="font-semibold">
                  Total savings: ${discountBreakdown.totalDiscountAmount.toFixed(2)}
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-4xl font-bold text-stone-900">
                ${basePrice.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Stock indicator */}
        {product.stock <= 5 && product.stock > 0 && (
          <p className="text-xs text-orange-600 font-medium">
            Only {product.stock} left in stock
          </p>
        )}
        {product.stock === 0 && (
          <p className="text-xs text-red-600 font-medium">Out of stock</p>
        )}
      </CardContent>

      <CardFooter className="mt-auto">
        <Button
          asChild
          size="lg"
          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          disabled={product.stock === 0}
        >
          <Link href={`/products/${product.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
