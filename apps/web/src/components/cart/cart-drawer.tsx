'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Trash2, Minus, Plus, ShoppingBag, CreditCard, MapPin, LogIn } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { useCartStore, type BillingPeriod } from '@/store/useCartStore'
import { useAuth } from '@/hooks/use-auth'
import { formatCurrency } from '@/lib/utils'

interface CartDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, updateBillingPeriod, subtotal, totalItems, hasSubscription } = useCartStore()
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  const handleCheckout = () => {
    if (!isAuthenticated) {
      onOpenChange(false)
      router.push('/auth/login?callbackUrl=/checkout')
      return
    }

    onOpenChange(false)
    router.push('/checkout')
  }

  const subscriptionItem = items.find((i) => i.type === 'subscription')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Shopping Cart ({totalItems()})</SheetTitle>
          <SheetDescription className="sr-only">
            Your shopping cart items
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-300" />
            <div>
              <p className="text-lg font-medium text-gray-900">Your cart is empty</p>
              <p className="text-sm text-gray-500 mt-1">
                Browse our products and add items to your cart.
              </p>
            </div>
            <Link
              href="/products"
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            {/* Item list */}
            <div className="flex-1 overflow-y-auto -mx-6 px-6 divide-y">
              {items.map((item) => {
                const isSubscription = item.type === 'subscription'

                return (
                  <div key={item.productId} className="py-4 space-y-3">
                    <div className="flex gap-3">
                      <div className="relative w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            {isSubscription ? (
                              <CreditCard className="w-6 h-6 text-gray-400" />
                            ) : (
                              <ShoppingBag className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-sm font-semibold text-blue-600 mt-0.5">
                          ${formatCurrency(item.price)}
                          {isSubscription && (
                            <span className="text-xs text-gray-500 font-normal ml-1">
                              /{item.billingPeriod === 'annual' ? 'year' : 'month'}
                            </span>
                          )}
                        </p>
                        {/* Quantity controls for products only */}
                        {!isSubscription && (
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-medium w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          ${formatCurrency(item.price * item.quantity)}
                        </p>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-gray-400 hover:text-red-500 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Subscription: description + billing toggle */}
                    {isSubscription && (
                      <div className="space-y-2.5 pl-0">
                        {item.description && (
                          <p className="text-xs text-gray-500 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Billing:</span>
                          <div className="inline-flex items-center bg-gray-100 rounded-lg p-0.5">
                            <button
                              onClick={() => updateBillingPeriod('monthly')}
                              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                                item.billingPeriod === 'monthly'
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              Monthly
                            </button>
                            <button
                              onClick={() => updateBillingPeriod('annual')}
                              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                                item.billingPeriod === 'annual'
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              Annual
                              {item.monthlyPrice && item.annualPrice && (
                                <span className="ml-1 text-[10px] text-green-400 font-semibold">
                                  Save 10%
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                        {item.billingPeriod === 'annual' && item.annualPrice && (
                          <p className="text-[11px] text-gray-400">
                            ${formatCurrency(item.annualPrice / 12)}/mo equivalent
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="border-t pt-4 space-y-4">
              {/* Local Pickup Reminder */}
              <div className="flex items-start gap-2.5 rounded-lg bg-blue-50 border border-blue-100 p-3">
                <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  <span className="font-semibold">Reminder:</span> All items are for local pickup only.
                </p>
              </div>
              <div className="flex justify-between text-base font-medium text-gray-900">
                <span>Subtotal</span>
                <span>${formatCurrency(subtotal())}</span>
              </div>
              {hasSubscription() && (
                <p className="text-xs text-blue-600">
                  Subscription will be processed as a recurring payment via Stripe.
                </p>
              )}
              <button
                onClick={handleCheckout}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
              >
                {isAuthenticated ? (
                  'Proceed to Checkout'
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Log in to Checkout
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
