'use client';

import Link from 'next/link';
import Image from 'next/image';

interface OrderCardProps {
  order: {
    id: string;
    status: string;
    totalAmount: string;
    createdAt: string;
    items: {
      id: string;
      quantity: number;
      price: string;
      product: {
        id: string;
        name: string;
        imageUrls: string[];
      };
    }[];
  };
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export function OrderCard({ order }: OrderCardProps) {
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        {/* Order Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Order #{order.id.slice(0, 8)}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{orderDate}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                statusColors[order.status] || 'bg-gray-100 text-gray-800'
              }`}
            >
              {order.status}
            </span>
            <p className="text-lg font-bold text-gray-900">
              ${parseFloat(order.totalAmount).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Order Items Preview */}
        <div className="space-y-3 mb-4">
          {order.items.slice(0, 3).map((item) => {
            const imageUrl =
              Array.isArray(item.product.imageUrls) && item.product.imageUrls.length > 0
                ? item.product.imageUrls[0]!
                : '/placeholder.png';

            return (
              <div key={item.id} className="flex items-center gap-3">
                <div className="relative w-16 h-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                  <Image
                    src={imageUrl}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {item.product.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Quantity: {item.quantity} × ${parseFloat(item.price).toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })}
          {order.items.length > 3 && (
            <p className="text-sm text-gray-600">
              +{order.items.length - 3} more item{order.items.length - 3 !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* View Details Link */}
        <Link
          href={`/orders/${order.id}`}
          className="block w-full text-center px-4 py-2 border border-primary-600 text-primary-600 rounded-md hover:bg-primary-50 transition font-medium"
        >
          View Order Details
        </Link>
      </div>
    </div>
  );
}
