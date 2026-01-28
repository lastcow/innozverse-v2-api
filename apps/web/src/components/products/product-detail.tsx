'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

interface ProductDetailProps {
  product: {
    id: string;
    name: string;
    description: string;
    basePrice: number;
    type: string;
    imageUrls: string[];
    properties: Record<string, any>;
    stock: number;
    active: boolean;
  };
}

export function ProductDetail({ product }: ProductDetailProps) {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const imageUrl = Array.isArray(product.imageUrls) && product.imageUrls.length > 0
    ? product.imageUrls[0]
    : 'https://via.placeholder.com/600x400?text=No+Image';

  const handleAddToCart = async () => {
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      // For authenticated users, use token
      // For guests, generate/use session ID
      const sessionId = !isAuthenticated
        ? localStorage.getItem('guestSessionId') || `guest-${Date.now()}`
        : undefined;

      if (!isAuthenticated && sessionId) {
        localStorage.setItem('guestSessionId', sessionId);
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (isAuthenticated && accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      } else if (sessionId) {
        headers['X-Session-Id'] = sessionId;
      }

      const response = await fetch(`${apiUrl}/api/v1/cart/items`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          productId: product.id,
          quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add to cart');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Image */}
      <div className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {/* Details */}
      <div className="space-y-6">
        <div>
          <span className="text-sm font-medium text-primary-600 uppercase">
            {product.type}
          </span>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{product.name}</h1>
          <p className="text-2xl font-bold text-gray-900 mt-4">
            ${parseFloat(product.basePrice.toString()).toFixed(2)}
          </p>
        </div>

        <div className="border-t border-b py-4">
          {product.stock > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-green-600 font-medium">In Stock</span>
              {product.stock <= 5 && (
                <span className="text-orange-600 text-sm">
                  (Only {product.stock} left)
                </span>
              )}
            </div>
          ) : (
            <span className="text-red-600 font-medium">Out of Stock</span>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
          <p className="text-gray-600">{product.description}</p>
        </div>

        {product.properties && Object.keys(product.properties).length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Specifications</h2>
            <dl className="space-y-2">
              {Object.entries(product.properties).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <dt className="text-gray-600 capitalize">{key}:</dt>
                  <dd className="text-gray-900 font-medium">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-800">Added to cart successfully!</div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label htmlFor="quantity" className="text-sm font-medium text-gray-900">
              Quantity:
            </label>
            <input
              type="number"
              id="quantity"
              min="1"
              max={product.stock}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              disabled={product.stock === 0}
            />
          </div>

          <button
            onClick={handleAddToCart}
            disabled={loading || product.stock === 0 || !product.active}
            className="w-full py-3 px-6 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Adding...' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>

          {!isAuthenticated && (
            <p className="text-sm text-gray-500 text-center">
              Sign in to sync your cart across devices
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
