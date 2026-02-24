'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { useCartStore } from '@/store/useCartStore'

type SessionStatus = 'complete' | 'open' | 'expired' | null

export default function CheckoutReturnPage() {
  return (
    <Suspense
      fallback={
        <>
          <Navbar />
          <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading...</p>
            </div>
          </main>
        </>
      }
    >
      <CheckoutReturnContent />
    </Suspense>
  )
}

function CheckoutReturnContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const clearCart = useCartStore((s) => s.clearCart)
  const [status, setStatus] = useState<SessionStatus>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found')
      setLoading(false)
      return
    }

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/checkout/session-status?session_id=${sessionId}`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Failed to verify payment')
          return
        }

        setStatus(data.status)
        if (data.status === 'complete') {
          clearCart()
        }
      } catch {
        setError('Failed to verify payment status')
      } finally {
        setLoading(false)
      }
    }

    checkStatus()
  }, [sessionId, clearCart])

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {loading ? (
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Verifying your payment...</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-500 mb-6">{error}</p>
            <Link
              href="/checkout"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition"
            >
              Try Again
            </Link>
          </div>
        ) : status === 'complete' ? (
          <div className="text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-500 mb-8">
              Thank you for your purchase. Your order is being processed.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/products"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : status === 'open' ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Not Completed</h1>
            <p className="text-gray-500 mb-6">
              Your payment session is still open. You can return to complete your checkout.
            </p>
            <Link
              href="/checkout"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition"
            >
              Return to Checkout
            </Link>
          </div>
        ) : (
          <div className="text-center">
            <XCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Session Expired</h1>
            <p className="text-gray-500 mb-6">
              Your checkout session has expired. Please try again.
            </p>
            <Link
              href="/checkout"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition"
            >
              Start New Checkout
            </Link>
          </div>
        )}
      </main>
    </>
  )
}
