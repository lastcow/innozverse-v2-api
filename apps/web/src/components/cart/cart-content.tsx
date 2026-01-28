'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { CartItem } from './cart-item';
import { CartSummary } from './cart-summary';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function CartContent() {
  const { accessToken, isAuthenticated } = useAuth();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCart = async () => {
    try {
      const sessionId = !isAuthenticated
        ? localStorage.getItem('guestSessionId')
        : undefined;

      const headers: Record<string, string> = {};

      if (isAuthenticated && accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      } else if (sessionId) {
        headers['X-Session-Id'] = sessionId;
      } else {
        setCart({ items: [], itemCount: 0, subtotal: '0.00' });
        setLoading(false);
        return;
      }

      const response = await fetch(`${apiUrl}/api/v1/cart`, {
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch cart');
      }

      setCart(data.cart);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [accessToken, isAuthenticated]);

  const handleUpdate = () => {
    fetchCart();
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading cart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchCart}
          className="text-primary-600 hover:text-primary-700"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
        <Link
          href="/products"
          className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        {cart.items.map((item: any) => (
          <CartItem
            key={item.id}
            item={item}
            onUpdate={handleUpdate}
            isAuthenticated={isAuthenticated}
            accessToken={accessToken}
          />
        ))}
      </div>

      <div className="lg:col-span-1">
        <CartSummary
          subtotal={cart.subtotal}
          itemCount={cart.itemCount}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </div>
  );
}
