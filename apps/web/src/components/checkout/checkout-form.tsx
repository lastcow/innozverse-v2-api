'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { ShoppingBag, CreditCard, MapPin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { stripePromise } from '@/lib/stripe'
import { formatCurrency } from '@/lib/utils'
import { useCartStore } from '@/store/useCartStore'
import { useAuth } from '@/hooks/use-auth'
import { createEmbeddedCheckoutSession } from '@/app/actions/stripe'

function OrderSummary() {
  const items = useCartStore((s) => s.items)
  const subtotal = useCartStore((s) => s.subtotal)

  return (
    <div className="space-y-6">
      {/* Items */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})
        </h2>
        <div className="divide-y divide-gray-100">
          {items.map((item) => {
            const isSubscription = item.type === 'subscription'
            return (
              <div key={item.productId} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <div className="relative w-14 h-14 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {isSubscription ? (
                        <CreditCard className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ShoppingBag className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  {isSubscription ? (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.billingPeriod === 'annual' ? 'Annual' : 'Monthly'} subscription
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900 flex-shrink-0">
                  ${formatCurrency(item.price * item.quantity)}
                  {isSubscription && (
                    <span className="text-xs text-gray-500 font-normal">
                      /{item.billingPeriod === 'annual' ? 'yr' : 'mo'}
                    </span>
                  )}
                </p>
              </div>
            )
          })}
        </div>

        {/* Subtotal */}
        <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Subtotal</span>
          <span className="text-lg font-semibold text-gray-900">${formatCurrency(subtotal())}</span>
        </div>
      </div>

      {/* Pickup notice */}
      <div className="flex items-start gap-3 rounded-lg bg-blue-50 border border-blue-100 p-4">
        <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          Any physical items need to be picked up at our company location. You will receive pickup details after your order is confirmed.
        </p>
      </div>
    </div>
  )
}

export function CheckoutForm() {
  const router = useRouter()
  const { user } = useAuth()
  const items = useCartStore((s) => s.items)
  const [hydrated, setHydrated] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setHydrated(true)
  }, [])

  const fetchClientSecret = useCallback(async () => {
    if (!user?.id) throw new Error('Not authenticated')
    const result = await createEmbeddedCheckoutSession(items, user.id, user.email ?? undefined)
    if (result.error) {
      setError(result.error)
      throw new Error(result.error)
    }
    return result.clientSecret!
  }, [items, user?.id, user?.email])

  if (!hydrated) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 text-center py-16">
        <ShoppingBag className="w-16 h-16 text-gray-300" />
        <div>
          <p className="text-lg font-medium text-gray-900">Your cart is empty</p>
          <p className="text-sm text-gray-500 mt-1">
            Add items to your cart before checking out.
          </p>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition"
        >
          Browse Products
        </Link>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => { setError(''); router.refresh() }}
          className="text-blue-600 hover:underline text-sm"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left column — order summary */}
      <div className="flex-1 min-w-0">
        <OrderSummary />
      </div>

      {/* Right column — payment (fixed width) */}
      <div className="w-full lg:w-[480px] lg:flex-shrink-0" id="checkout">
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{ fetchClientSecret }}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    </div>
  )
}
