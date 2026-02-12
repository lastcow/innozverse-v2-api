'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tag, CheckCircle2, Percent, Monitor, Cpu, Gamepad2, Package } from 'lucide-react'
import Link from 'next/link'

interface FeaturedProduct {
  id: string
  name: string
  description: string
  basePrice: number
  imageUrls: string[]
  studentDiscountPercentage: number | null
  type: string
  stock: number
  properties: Record<string, string>
}

interface StudentAdvantageProps {
  products: FeaturedProduct[]
}

const getCategoryIcon = (type: string) => {
  switch (type) {
    case 'SURFACE':
      return <Monitor className="w-16 h-16 text-stone-400 mx-auto mb-2" />
    case 'LAPTOP':
      return <Cpu className="w-16 h-16 text-stone-400 mx-auto mb-2" />
    case 'XBOX':
      return <Gamepad2 className="w-16 h-16 text-stone-400 mx-auto mb-2" />
    default:
      return <Package className="w-16 h-16 text-stone-400 mx-auto mb-2" />
  }
}

const getProductTag = (type: string): string => {
  switch (type) {
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

const getProductSpecs = (properties: Record<string, string>): string[] => {
  const specs: string[] = []
  if (properties.processor) specs.push(properties.processor)
  if (properties.ram) specs.push(properties.ram)
  if (properties.storage) specs.push(properties.storage)
  if (properties.display) specs.push(properties.display)
  if (properties.graphics) specs.push(properties.graphics)
  return specs.slice(0, 3)
}

export function StudentAdvantage({ products }: StudentAdvantageProps) {
  return (
    <section className="py-24 bg-gradient-to-br from-orange-50 via-stone-50 to-green-50/30">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Verification Banner */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl p-8 mb-16 shadow-xl text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Tag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-bold mb-2">
                    Verify Your Student Status
                  </h3>
                  <p className="text-orange-100">
                    Unlock up to 40% off premium hardware & software.
                    Quick verification with your .edu email.
                  </p>
                </div>
              </div>
              <Button
                asChild
                size="lg"
                className="bg-white text-orange-600 hover:bg-orange-50 flex-shrink-0"
              >
                <Link href="/auth/register">
                  Verify Now
                </Link>
              </Button>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900 mb-4">
              The Student Advantage
            </h2>
            <p className="text-xl text-stone-600 max-w-2xl mx-auto">
              Premium tools shouldn't break the bank. Get real discounts on the tech you need to succeed.
            </p>
          </div>

          {/* Products Grid */}
          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {products.map((product) => {
                const hasStudentDiscount = product.studentDiscountPercentage !== null && product.studentDiscountPercentage > 0
                const discountPercent = hasStudentDiscount ? product.studentDiscountPercentage! : 0
                const discountedPrice = hasStudentDiscount
                  ? product.basePrice * (1 - discountPercent / 100)
                  : product.basePrice
                const specs = getProductSpecs(product.properties)
                const tag = (product.properties as Record<string, string>).tag || getProductTag(product.type)

                return (
                  <Card
                    key={product.id}
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
                        {product.imageUrls.length > 0 ? (
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

                    <CardContent className="flex flex-col flex-grow pb-6">
                      <div className="flex-grow" />
                      <div className="space-y-3">
                        {/* Discount Badge */}
                        {hasStudentDiscount && (
                          <div className="flex flex-wrap gap-2">
                            <Badge className="bg-orange-600 text-white text-xs px-2 py-0.5 flex items-center gap-1">
                              <Percent className="w-3 h-3" />
                              Student -{discountPercent}%
                            </Badge>
                          </div>
                        )}

                        {/* Pricing */}
                        <div className="space-y-1">
                          {hasStudentDiscount ? (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-stone-400 line-through text-lg">
                                  ${product.basePrice.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex items-baseline gap-1">
                                <span className="font-serif text-4xl font-bold text-orange-600">
                                  ${discountedPrice.toFixed(2)}
                                </span>
                              </div>
                              <p className="text-xs text-green-600 font-semibold">
                                Save ${(product.basePrice - discountedPrice).toFixed(2)}
                              </p>
                            </>
                          ) : (
                            <div className="flex items-baseline gap-1">
                              <span className="font-serif text-4xl font-bold text-stone-900">
                                ${product.basePrice.toFixed(2)}
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
                      </div>
                    </CardContent>

                    <CardFooter>
                      <Button
                        asChild
                        size="lg"
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        <Link href={`/products/${product.id}`}>View Details</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 mb-12">
              <p className="text-stone-500 text-lg">
                New products coming soon. Check back later!
              </p>
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-stone-900 mb-1">Instant Verification</h4>
                <p className="text-sm text-stone-600">
                  Get approved in minutes with your .edu email
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-stone-900 mb-1">Exclusive Bundles</h4>
                <p className="text-sm text-stone-600">
                  Save even more with curated tech packages
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-stone-900 mb-1">Price Protection</h4>
                <p className="text-sm text-stone-600">
                  If the price drops within 60 days of purchase, we'll refund the difference
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
