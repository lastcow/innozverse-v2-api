'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { ShoppingBag, MapPin, Clock, Info } from 'lucide-react'
import Link from 'next/link'
import { stripePromise } from '@/lib/stripe'
import { useCartStore } from '@/store/useCartStore'
import { useAuth } from '@/hooks/use-auth'
import { createEmbeddedCheckoutSession } from '@/app/actions/stripe'

function OrderSummary() {
  return (
    <div className="space-y-4">
      {/* Pickup location */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Pickup Location</h2>
        <div className="flex items-start gap-3 mb-4">
          <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900">Innozverse</p>
            <p className="text-sm text-gray-600">2 W Main St, Frostburg, MD 21532</p>
          </div>
        </div>
        <div className="flex items-start gap-3 mb-4">
          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-600">
            <p>Mon–Fri: 6 PM – 9 PM</p>
            <p>Sat: 1 PM – 6 PM</p>
            <p>Sun: Closed</p>
          </div>
        </div>
        <div className="rounded-lg overflow-hidden border border-gray-200">
          <iframe
            src="https://www.google.com/maps?q=2+W+Main+St,+Frostburg,+MD,+21532&output=embed"
            width="100%"
            height="200"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Pickup Location"
            className="w-full h-[200px]"
          />
        </div>
      </div>

      {/* Pickup info */}
      <div className="flex items-start gap-3 rounded-lg bg-blue-50 border border-blue-100 p-4">
        <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          Any physical items need to be picked up at our location. You will receive pickup details after your order is confirmed.
        </p>
      </div>

      {/* Backorder notice */}
      <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-4">
        <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700">
          If your item is on backorder, please wait for a notification before coming to pick up. We will email you once your order is ready.
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
