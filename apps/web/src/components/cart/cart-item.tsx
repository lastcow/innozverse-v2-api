'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface CartItemProps {
  item: {
    id: string;
    quantity: number;
    product: {
      id: string;
      name: string;
      basePrice: number;
      imageUrls: string[];
      type: string;
      stock: number;
    };
  };
  onUpdate: () => void;
  isAuthenticated: boolean;
  accessToken?: string;
}

export function CartItem({ item, onUpdate, isAuthenticated, accessToken }: CartItemProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const imageUrl = Array.isArray(item.product.imageUrls) && item.product.imageUrls.length > 0
    ? item.product.imageUrls[0]!
    : '/placeholder.png';

  const handleUpdateQuantity = async (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > item.product.stock) return;

    setLoading(true);
    setError('');

    try {
      const sessionId = !isAuthenticated
        ? localStorage.getItem('guestSessionId')
        : undefined;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (isAuthenticated && accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      } else if (sessionId) {
        headers['X-Session-Id'] = sessionId;
      }

      const response = await fetch(`${apiUrl}/api/v1/cart/items/${item.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ quantity: newQuantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update quantity');
      }

      onUpdate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    setError('');

    try {
      const sessionId = !isAuthenticated
        ? localStorage.getItem('guestSessionId')
        : undefined;

      const headers: Record<string, string> = {};

      if (isAuthenticated && accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      } else if (sessionId) {
        headers['X-Session-Id'] = sessionId;
      }

      const response = await fetch(`${apiUrl}/api/v1/cart/items/${item.id}`, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove item');
      }

      onUpdate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const itemTotal = parseFloat(item.product.basePrice.toString()) * item.quantity;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-800 text-sm rounded-md">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <Link href={`/products/${item.product.id}`} className="flex-shrink-0">
          <div className="relative w-24 h-24 bg-gray-200 rounded-md overflow-hidden">
            <Image
              src={imageUrl}
              alt={item.product.name}
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <Link
            href={`/products/${item.product.id}`}
            className="text-lg font-semibold text-gray-900 hover:text-primary-600 line-clamp-2"
          >
            {item.product.name}
          </Link>
          <p className="text-sm text-gray-600 mt-1">{item.product.type}</p>
          <p className="text-lg font-bold text-gray-900 mt-2">
            ${parseFloat(item.product.basePrice.toString()).toFixed(2)}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleUpdateQuantity(item.quantity - 1)}
              disabled={loading || item.quantity <= 1}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              -
            </button>
            <span className="w-12 text-center font-medium">{item.quantity}</span>
            <button
              onClick={() => handleUpdateQuantity(item.quantity + 1)}
              disabled={loading || item.quantity >= item.product.stock}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>

          <p className="text-lg font-bold text-gray-900">
            ${itemTotal.toFixed(2)}
          </p>

          <button
            onClick={handleRemove}
            disabled={loading}
            className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </div>

      {item.product.stock <= 5 && (
        <p className="mt-2 text-sm text-blue-600">
          Only {item.product.stock} left in stock
        </p>
      )}
    </div>
  );
}
