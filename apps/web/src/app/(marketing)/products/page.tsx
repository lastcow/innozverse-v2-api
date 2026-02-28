'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Cpu, Monitor, Gamepad2, Keyboard, FlaskConical, Loader2, Tag, Percent, Clock } from 'lucide-react'
import Link from 'next/link'
import type { EventDiscount } from '@repo/types'
import {
  calculateDiscountBreakdown,
  getActiveEventDiscount,
  formatDiscountPercentage,
} from '@/lib/discount'
import { formatCurrency } from '@/lib/utils'
import { getStudentVerificationStatus } from '@/app/actions/student'

const HomeNetworkCanvas = dynamic(
  () =>
    import('@/components/home/HomeNetworkCanvas').then(
      (mod) => mod.HomeNetworkCanvas
    ),
  { ssr: false }
)

type ProductType = 'SURFACE' | 'LAPTOP' | 'XBOX' | 'ACCESSORY' | 'STEM'
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
  isRefurbished: boolean
  isOpenBox: boolean
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
  { value: 'ACCESSORY', label: 'Accessories' },
  { value: 'STEM', label: 'STEM' },
]

const getCategoryIcon = (type: ProductType) => {
  switch (type) {
    case 'SURFACE':
      return <Monitor className="w-16 h-16 text-slate-400 mx-auto mb-2" />
    case 'LAPTOP':
      return <Cpu className="w-16 h-16 text-slate-400 mx-auto mb-2" />
    case 'XBOX':
      return <Gamepad2 className="w-16 h-16 text-slate-400 mx-auto mb-2" />
    case 'ACCESSORY':
      return <Keyboard className="w-16 h-16 text-slate-400 mx-auto mb-2" />
    case 'STEM':
      return <FlaskConical className="w-16 h-16 text-slate-400 mx-auto mb-2" />
    default:
      return <Cpu className="w-16 h-16 text-slate-400 mx-auto mb-2" />
  }
}

const getCategoryLabel = (type: ProductType): string => {
  const category = categories.find((c) => c.value === type)
  return category?.label || type
}

const HIDDEN_KEYS = new Set(['tag'])

const getProductSpecs = (product: Product): { label: string; value: string }[] => {
  const props = product.properties as Record<string, unknown>
  return Object.entries(props)
    .filter(([key]) => !HIDDEN_KEYS.has(key))
    .map(([key, value]) => ({
      label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim(),
      value: String(value),
    }))
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
    case 'ACCESSORY':
      return 'Accessory'
    case 'STEM':
      return 'STEM'
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

  // Auto-enable student pricing for verified students
  useEffect(() => {
    getStudentVerificationStatus().then((result) => {
      if (result.status === 'APPROVED') {
        setShowStudentPricing(true)
      }
    }).catch(() => {})
  }, [])

  // Get the best active event discount (highest percentage)
  const activeEventDiscount = getActiveEventDiscount(activeEventDiscounts)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  const fetchProducts = async (typeFilter?: ProductType) => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({ active: 'true' })
      if (typeFilter) params.set('type', typeFilter)
      const response = await fetch(`${apiUrl}/api/v1/products?${params}`)
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
      <section className="relative py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
        <div className="absolute inset-0">
          <HomeNetworkCanvas />
        </div>
        <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 mb-4">
              Tools for Your Journey.
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              Premium hardware to power your studies and downtime. Verified students save up to 40%.
            </p>
          </div>
        </div>
      </section>

      {/* Filter & Toggle Section */}
      <section className="py-8 bg-white border-b-2 border-gray-200">
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
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                    showStudentPricing ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showStudentPricing ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <label
                  className="text-sm font-medium text-slate-900 cursor-pointer"
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
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-slate-600">Loading products...</span>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-red-600 text-lg">{error}</p>
                <Button
                  onClick={() => fetchProducts(selectedCategory === 'all' ? undefined : selectedCategory)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Try Again
                </Button>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-slate-600 text-lg">
                  No products found in this category.
                </p>
              </div>
            ) : selectedCategory === 'all' ? (
              // Grouped by category view
              <div className="space-y-12">
                {(Object.keys(groupedProducts) as ProductType[]).map((type) => (
                  <div key={type}>
                    <h2 className="text-3xl font-bold text-slate-900 mb-6">
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
      <section className="py-16 bg-gradient-to-br from-blue-50 via-white to-blue-50/30">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-4xl font-bold text-slate-900">
              Not a student yet?
            </h2>
            <p className="text-xl text-slate-600">
              Verify your student status to unlock exclusive discounts on all products.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20">
                <Link href="/user/settings/profile">Verify Student Status</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-2 border-gray-300 hover:bg-slate-100"
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
      className="relative rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-blue-300 bg-white flex flex-col"
    >
      {/* Product Tag */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
        <Badge className="bg-blue-600 text-white shadow-lg px-4 py-1">
          {tag}
        </Badge>
      </div>

      <CardHeader className="space-y-4 pb-6">
        {/* Condition Badges */}
        {(product.isRefurbished || product.isOpenBox) && (
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
            {product.isRefurbished && (
              <Badge className="bg-amber-500 text-white text-[10px] px-2 py-0.5">
                Refurbished
              </Badge>
            )}
            {product.isOpenBox && (
              <Badge className="bg-purple-500 text-white text-[10px] px-2 py-0.5">
                Open Box
              </Badge>
            )}
          </div>
        )}

        {/* Product Image or Placeholder */}
        <div className="aspect-square rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden">
          {product.imageUrls && product.imageUrls.length > 0 ? (
            <img
              src={product.imageUrls[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center">
              {getCategoryIcon(product.type)}
              <p className="text-sm text-slate-400 font-medium">{product.name}</p>
            </div>
          )}
        </div>

        {/* Product Title */}
        <CardTitle className="text-2xl text-slate-900">
          {product.name}
        </CardTitle>

        {/* Specs */}
        {specs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {specs.map((spec, index) => (
              <Badge
                key={index}
                variant="outline"
                className="border-gray-300 text-slate-700 text-xs"
              >
                {spec.label}: {spec.value}
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
              <Badge className="bg-blue-600 text-white text-xs px-2 py-0.5 flex items-center gap-1">
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
                <span className="text-slate-400 line-through text-lg">
                  ${formatCurrency(basePrice)}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-blue-600">
                  ${formatCurrency(finalPrice)}
                </span>
              </div>
              <div className="text-xs text-green-600 font-medium space-y-0.5">
                {discountBreakdown.studentDiscountAmount > 0 && (
                  <p>
                    Student discount: -${formatCurrency(discountBreakdown.studentDiscountAmount)}
                  </p>
                )}
                {discountBreakdown.eventDiscountAmount > 0 && (
                  <p>
                    Event discount: -${formatCurrency(discountBreakdown.eventDiscountAmount)}
                  </p>
                )}
                <p className="font-semibold">
                  Total savings: ${formatCurrency(discountBreakdown.totalDiscountAmount)}
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-slate-900">
                ${formatCurrency(basePrice)}
              </span>
            </div>
          )}
        </div>

        {/* Stock indicator */}
        {product.stock <= 5 && product.stock > 0 && (
          <p className="text-xs text-blue-600 font-medium">
            Only {product.stock} left in stock
          </p>
        )}
        {product.stock === 0 && (
          <p className="text-xs text-red-600 font-medium">Out of stock</p>
        )}

        {/* Back order notice */}
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700 font-medium">
            Back order available &middot; ~1 week lead time
          </p>
        </div>
      </CardContent>

      <CardFooter className="mt-auto">
        <Button
          asChild
          size="lg"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          disabled={product.stock === 0}
        >
          <Link href={`/products/${product.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
