'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface OrderDetailProps {
  orderId: string;
}

interface Order {
  id: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  items: {
    id: string;
    quantity: number;
    price: string;
    product: {
      id: string;
      name: string;
      basePrice: number;
      imageUrls: string[];
      type: string;
    };
  }[];
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export function OrderDetail({ orderId }: OrderDetailProps) {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/v1/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch order');
        }

        setOrder(data.order);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) {
      fetchOrder();
    }
  }, [accessToken, orderId]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading order...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error || 'Order not found'}</p>
        <button
          onClick={() => router.push('/orders')}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/orders"
        className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
      >
        ← Back to Orders
      </Link>

      {/* Order Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Order #{order.id.slice(0, 8)}
            </h1>
            <p className="text-sm text-gray-600 mt-1">Placed on {orderDate}</p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              statusColors[order.status] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {order.status}
          </span>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Amount</span>
            <span className="text-2xl font-bold text-gray-900">
              ${parseFloat(order.totalAmount).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
        <div className="space-y-4">
          {order.items.map((item) => {
            const imageUrl =
              Array.isArray(item.product.imageUrls) && item.product.imageUrls.length > 0
                ? item.product.imageUrls[0]!
                : '/placeholder.png';

            const itemTotal = parseFloat(item.price) * item.quantity;

            return (
              <div
                key={item.id}
                className="flex gap-4 pb-4 border-b last:border-b-0 last:pb-0"
              >
                <Link
                  href={`/products/${item.product.id}`}
                  className="flex-shrink-0"
                >
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
                  <p className="text-sm text-gray-600 mt-2">
                    Quantity: {item.quantity}
                  </p>
                  <p className="text-sm text-gray-600">
                    Price: ${parseFloat(item.price).toFixed(2)} each
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    ${itemTotal.toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="mt-6 pt-6 border-t">
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${parseFloat(order.totalAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>$0.00</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-lg font-bold text-gray-900">
              <span>Total</span>
              <span>${parseFloat(order.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Timeline */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-2 h-2 mt-2 bg-green-500 rounded-full" />
            <div>
              <p className="font-medium text-gray-900">Order Placed</p>
              <p className="text-sm text-gray-600">{orderDate}</p>
            </div>
          </div>
          {order.status !== 'PENDING' && (
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full" />
              <div>
                <p className="font-medium text-gray-900">Status: {order.status}</p>
                <p className="text-sm text-gray-600">
                  Last updated: {new Date(order.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
