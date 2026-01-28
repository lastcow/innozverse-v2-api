'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CartSummaryProps {
  subtotal: string;
  itemCount: number;
  isAuthenticated: boolean;
}

export function CartSummary({ subtotal, itemCount, isAuthenticated }: CartSummaryProps) {
  const router = useRouter();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push('/auth/login?callbackUrl=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  const subtotalNum = parseFloat(subtotal);
  const tax = 0; // MVP: no tax
  const total = subtotalNum + tax;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
          <span>${subtotalNum.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span>Tax</span>
          <span>${tax.toFixed(2)}</span>
        </div>

        <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={handleCheckout}
        className="w-full py-3 px-6 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition"
      >
        {isAuthenticated ? 'Proceed to Checkout' : 'Sign in to Checkout'}
      </button>

      {!isAuthenticated && (
        <p className="mt-4 text-sm text-gray-500 text-center">
          You need to sign in to place an order
        </p>
      )}

      <Link
        href="/products"
        className="mt-4 block text-center text-sm text-primary-600 hover:text-primary-700"
      >
        Continue Shopping
      </Link>
    </div>
  );
}
