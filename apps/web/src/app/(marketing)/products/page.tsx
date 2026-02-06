'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Cpu, HardDrive, Monitor, Gamepad2 } from 'lucide-react'
import Link from 'next/link'

type Category = 'all' | 'laptops' | 'consoles' | 'accessories'

interface Product {
  id: string
  name: string
  category: Category
  publicPrice: number
  studentPrice: number
  tag: string
  specs: string[]
  image?: string
}

const products: Product[] = [
  {
    id: 'surface-pro-9',
    name: 'Surface Pro 9',
    category: 'laptops',
    publicPrice: 999,
    studentPrice: 899,
    tag: 'Best for Notes',
    specs: ['Intel i5', '8GB RAM', '256GB SSD'],
  },
  {
    id: 'high-performance-laptop',
    name: 'High-Performance Laptop',
    category: 'laptops',
    publicPrice: 1499,
    studentPrice: 1299,
    tag: 'VR Ready',
    specs: ['RTX 4060', '16GB RAM', '1TB SSD'],
  },
  {
    id: 'xbox-series-x',
    name: 'Xbox Series X',
    category: 'consoles',
    publicPrice: 499,
    studentPrice: 449,
    tag: 'Study Break',
    specs: ['4K Gaming', '1TB Storage', 'Xbox Game Pass'],
  },
]

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('all')
  const [showStudentPricing, setShowStudentPricing] = useState(false)

  const filteredProducts = products.filter(
    (product) => selectedCategory === 'all' || product.category === selectedCategory
  )

  const categories: { value: Category; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'laptops', label: 'Laptops' },
    { value: 'consoles', label: 'Consoles' },
    { value: 'accessories', label: 'Accessories' },
  ]

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
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-stone-600 text-lg">
                  No products found in this category.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="relative rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-stone-200 hover:border-orange-300 bg-white flex flex-col"
                  >
                    {/* Product Tag */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-orange-600 text-white shadow-lg px-4 py-1">
                        {product.tag}
                      </Badge>
                    </div>

                    <CardHeader className="space-y-4 pb-6">
                      {/* Placeholder Image */}
                      <div className="aspect-square rounded-xl bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center overflow-hidden">
                        <div className="text-center">
                          {product.category === 'laptops' ? (
                            <Monitor className="w-16 h-16 text-stone-400 mx-auto mb-2" />
                          ) : product.category === 'consoles' ? (
                            <Gamepad2 className="w-16 h-16 text-stone-400 mx-auto mb-2" />
                          ) : (
                            <Cpu className="w-16 h-16 text-stone-400 mx-auto mb-2" />
                          )}
                          <p className="text-sm text-stone-400 font-medium">{product.name}</p>
                        </div>
                      </div>

                      {/* Product Title */}
                      <CardTitle className="font-serif text-2xl text-stone-900">
                        {product.name}
                      </CardTitle>

                      {/* Specs */}
                      <div className="flex flex-wrap gap-2">
                        {product.specs.map((spec, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="border-stone-300 text-stone-700 text-xs"
                          >
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 pb-6 flex-grow">
                      {/* Pricing */}
                      <div className="space-y-1">
                        {showStudentPricing ? (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-stone-400 line-through text-lg">
                                ${product.publicPrice}
                              </span>
                              <Badge className="bg-orange-600 text-white text-xs px-2 py-0.5">
                                Student
                              </Badge>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="font-serif text-4xl font-bold text-orange-600">
                                ${product.studentPrice}
                              </span>
                            </div>
                            <p className="text-xs text-green-600 font-medium">
                              Save ${product.publicPrice - product.studentPrice} (
                              {Math.round(
                                ((product.publicPrice - product.studentPrice) /
                                  product.publicPrice) *
                                  100
                              )}
                              % off)
                            </p>
                          </>
                        ) : (
                          <div className="flex items-baseline gap-1">
                            <span className="font-serif text-4xl font-bold text-stone-900">
                              ${product.publicPrice}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter className="mt-auto">
                      <Button
                        asChild
                        size="lg"
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        <Link href={`/products/${product.id}`}>View Details</Link>
                      </Button>
                    </CardFooter>
                  </Card>
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
