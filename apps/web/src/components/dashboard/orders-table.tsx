'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { formatRelativeDate } from '@/lib/date-utils';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Order item interface matching API response
 */
interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  priceAtPurchase: string;
  productSnapshot: {
    name: string;
    properties?: {
      upc?: string;
      sn?: string;
      [key: string]: unknown;
    };
  };
  createdAt: string;
  product: {
    id: string;
    name: string;
    imageUrls: string[];
  };
}

/**
 * Order interface matching API response
 */
interface Order {
  id: string;
  userId: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  subtotal: string;
  discountAmount: string;
  tax: string;
  total: string;
  placedAt: string;
  updatedAt: string;
  items: OrderItem[];
}

/**
 * Pagination response from API
 */
interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Flattened row for display in table
 */
interface OrderItemRow {
  orderId: string;
  orderStatus: Order['status'];
  itemId: string;
  productName: string;
  upc: string;
  sn: string;
  price: string;
  discount: string;
  purchasedAt: string;
}

/**
 * Status badge color mapping
 */
const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

/**
 * OrdersTable component displays a paginated table of user's orders
 * with filtering by status and search by product name.
 */
export function OrdersTable() {
  const { accessToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Fetch orders from API with pagination and filters
   */
  const fetchOrders = useCallback(async () => {
    if (!accessToken) return;

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      params.set('page', String(pagination.page));
      params.set('limit', String(pagination.limit));
      if (statusFilter) {
        params.set('status', statusFilter);
      }

      const response = await fetch(
        `${apiUrl}/api/v1/orders?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch orders');
      }

      setOrders(data.orders);
      setPagination(data.pagination);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, pagination.page, pagination.limit, statusFilter]);

  useEffect(() => {
    if (accessToken) {
      fetchOrders();
    }
  }, [accessToken, fetchOrders]);

  /**
   * Flatten orders into individual item rows for table display
   */
  const flattenOrderItems = (orders: Order[]): OrderItemRow[] => {
    const rows: OrderItemRow[] = [];

    for (const order of orders) {
      for (const item of order.items) {
        // Extract UPC and SN from productSnapshot properties
        const upc = item.productSnapshot?.properties?.upc || 'N/A';
        const sn = item.productSnapshot?.properties?.sn || 'N/A';

        // Calculate discount per item (total discount divided by item count)
        const itemCount = order.items.length;
        const totalDiscount = parseFloat(order.discountAmount) || 0;
        const itemDiscount = itemCount > 0 ? totalDiscount / itemCount : 0;

        rows.push({
          orderId: order.id,
          orderStatus: order.status,
          itemId: item.id,
          productName: item.productSnapshot?.name || item.product?.name || 'Unknown Product',
          upc,
          sn,
          price: parseFloat(item.priceAtPurchase).toFixed(2),
          discount: itemDiscount.toFixed(2),
          purchasedAt: order.placedAt,
        });
      }
    }

    return rows;
  };

  /**
   * Filter rows by search query (client-side filtering for product name)
   */
  const filterBySearch = (rows: OrderItemRow[]): OrderItemRow[] => {
    if (!searchQuery.trim()) {
      return rows;
    }

    const query = searchQuery.toLowerCase().trim();
    return rows.filter((row) =>
      row.productName.toLowerCase().includes(query)
    );
  };

  // Get flattened and filtered rows
  const orderRows = filterBySearch(flattenOrderItems(orders));

  // Loading state
  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading orders...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm">
        <p className="text-gray-500 mb-4">You haven&apos;t placed any orders yet.</p>
        <a
          href="/products"
          className="inline-block px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition"
        >
          Start Shopping
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Your Orders</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search by product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 w-full sm:w-64"
          />
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  UPC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchased
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orderRows.map((row) => (
                <tr key={row.itemId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {row.productName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row.upc}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row.sn}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${row.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${row.discount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        statusColors[row.orderStatus] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {row.orderStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatRelativeDate(row.purchasedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* No results after filtering */}
        {orderRows.length === 0 && orders.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              No orders found matching your search criteria.
            </p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} orders)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: Math.max(1, prev.page - 1),
                }))
              }
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: Math.min(prev.totalPages, prev.page + 1),
                }))
              }
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
