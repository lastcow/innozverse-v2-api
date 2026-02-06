'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tag, CheckCircle2, TrendingDown } from 'lucide-react'
import Link from 'next/link'

const products = [
  {
    name: 'Surface Pro 9',
    category: 'Laptop',
    publicPrice: 999,
    studentPrice: 649,
    savings: 35,
    image: '/products/surface-placeholder.svg',
  },
  {
    name: 'MacBook Pro 14"',
    category: 'Laptop',
    publicPrice: 1999,
    studentPrice: 1299,
    savings: 35,
    image: '/products/macbook-placeholder.svg',
  },
  {
    name: 'Xbox Series S',
    category: 'Gaming',
    publicPrice: 299,
    studentPrice: 199,
    savings: 33,
    image: '/products/xbox-placeholder.svg',
  },
]

export function StudentAdvantage() {
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {products.map((product, index) => (
              <Card
                key={index}
                className="border-2 border-stone-200 hover:border-orange-300 transition-all duration-300 hover:shadow-xl bg-white group"
              >
                <CardHeader>
                  {/* Product Image Placeholder */}
                  <div className="aspect-square bg-gradient-to-br from-stone-100 to-stone-200 rounded-xl mb-4 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                    <div className="text-stone-400 text-sm font-medium">
                      {product.name}
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                      {product.category}
                    </span>
                  </div>

                  <CardTitle className="text-xl text-stone-900 mb-2">
                    {product.name}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Pricing Comparison */}
                  <div className="space-y-2">
                    {/* Public Price (Crossed Out) */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-stone-500">Public Price:</span>
                      <span className="text-lg text-stone-400 line-through">
                        ${product.publicPrice}
                      </span>
                    </div>

                    {/* Student Price (Highlighted) */}
                    <div className="flex items-center justify-between bg-orange-50 -mx-4 px-4 py-2 rounded-lg">
                      <span className="text-sm font-medium text-orange-900">Student Price:</span>
                      <span className="text-2xl font-bold text-orange-600">
                        ${product.studentPrice}
                      </span>
                    </div>

                    {/* Savings Badge */}
                    <div className="flex items-center gap-2 text-green-700">
                      <TrendingDown className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Save {product.savings}% (${product.publicPrice - product.studentPrice})
                      </span>
                    </div>
                  </div>

                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-2 border-orange-200 hover:bg-orange-50 hover:border-orange-300 text-orange-600"
                  >
                    <Link href={`/products`}>
                      View Details
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

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
                  If the price drops, we'll refund the difference
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
