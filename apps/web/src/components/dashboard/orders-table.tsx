'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { formatRelativeDate } from '@/lib/date-utils';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  Package,
  ShoppingBag,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Hash,
  DollarSign,
  Tag,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  priceAtPurchase: string;
  serialNumber: string | null;
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
    upc?: string;
    imageUrls: string[];
  };
}

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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

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

type OrderStatus = Order['status'];

const statusConfig: Record<OrderStatus, { label: string; className: string; icon: typeof Clock }> = {
  PENDING: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-0', icon: Clock },
  PROCESSING: { label: 'Processing', className: 'bg-blue-50 text-blue-700 border-0', icon: Loader2 },
  SHIPPED: { label: 'Shipped', className: 'bg-purple-50 text-purple-700 border-0', icon: Truck },
  DELIVERED: { label: 'Delivered', className: 'bg-emerald-50 text-emerald-700 border-0', icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-50 text-red-700 border-0', icon: XCircle },
};

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
  const [cancellingOrders, setCancellingOrders] = useState<Set<string>>(new Set());

  const handleCancelOrder = async (orderId: string) => {
    if (!accessToken) return;
    setCancellingOrders((prev) => new Set(prev).add(orderId));
    try {
      const response = await fetch(`${apiUrl}/api/v1/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel order');
      }
      toast.success('Order cancelled successfully');
      fetchOrders();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to cancel order';
      toast.error(message);
    } finally {
      setCancellingOrders((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

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

  const flattenOrderItems = (orders: Order[]): OrderItemRow[] => {
    const rows: OrderItemRow[] = [];

    for (const order of orders) {
      for (const item of order.items) {
        const upc = item.product?.upc || item.productSnapshot?.properties?.upc || 'N/A';
        const sn = item.serialNumber || item.productSnapshot?.properties?.sn || 'N/A';

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

  const filterBySearch = (rows: OrderItemRow[]): OrderItemRow[] => {
    if (!searchQuery.trim()) return rows;
    const query = searchQuery.toLowerCase().trim();
    return rows.filter((row) => row.productName.toLowerCase().includes(query));
  };

  const orderRows = filterBySearch(flattenOrderItems(orders));

  // Loading state
  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#4379EE] border-r-transparent"></div>
        <p className="mt-4 text-gray-500 text-sm">Loading your orders...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-16 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-4">
          <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        <p className="text-red-600 font-medium mb-2">Something went wrong</p>
        <p className="text-gray-500 text-sm mb-4">{error}</p>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-[#4379EE] text-white text-sm font-medium rounded-xl hover:bg-[#3568d4] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Empty state
  if (orders.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-50 mb-4">
          <ShoppingBag className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-[#202224] font-semibold text-lg mb-1">No orders yet</p>
        <p className="text-gray-500 text-sm mb-6">
          Your purchase history will appear here once you place an order.
        </p>
        <a
          href="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4379EE] text-white text-sm font-medium rounded-xl hover:bg-[#3568d4] transition-colors shadow-sm shadow-blue-500/20"
        >
          <Package className="w-4 h-4" />
          Browse Products
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Package className="w-4 h-4" />
          <span>
            {pagination.total} order{pagination.total !== 1 ? 's' : ''} total
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-9 pr-4 w-full sm:w-56 rounded-xl border border-gray-200 bg-white text-sm text-[#202224] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4379EE]/20 focus:border-[#4379EE] transition-colors"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="h-10 pl-9 pr-8 rounded-xl border border-gray-200 bg-white text-sm text-[#202224] focus:outline-none focus:ring-2 focus:ring-[#4379EE]/20 focus:border-[#4379EE] transition-colors appearance-none cursor-pointer"
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
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-100 hover:bg-transparent">
              <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  Product
                </div>
              </TableHead>
              <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" />
                  UPC
                </div>
              </TableHead>
              <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" />
                  SN
                </div>
              </TableHead>
              <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  Price
                </div>
              </TableHead>
              <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  Discount
                </div>
              </TableHead>
              <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Purchased
                </div>
              </TableHead>
              <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderRows.map((row) => {
              const config = statusConfig[row.orderStatus];
              const StatusIcon = config.icon;
              return (
                <TableRow key={row.itemId} className="border-gray-50 hover:bg-gray-50/50">
                  <TableCell className="font-medium text-[#202224] text-sm">
                    {row.productName}
                  </TableCell>
                  <TableCell>
                    {row.upc !== 'N/A' ? (
                      <span className="font-mono text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-lg">
                        {row.upc}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-sm">&mdash;</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.sn !== 'N/A' ? (
                      <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">
                        {row.sn}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-sm">&mdash;</span>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold text-[#202224] text-sm">
                    ${row.price}
                  </TableCell>
                  <TableCell className="text-sm">
                    {parseFloat(row.discount) > 0 ? (
                      <span className="text-emerald-600 font-medium">-${row.discount}</span>
                    ) : (
                      <span className="text-gray-300">&mdash;</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${config.className} gap-1 font-medium`}>
                      <StatusIcon className={`w-3 h-3 ${row.orderStatus === 'PROCESSING' ? 'animate-spin' : ''}`} />
                      {config.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {formatRelativeDate(row.purchasedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {!['DELIVERED', 'CANCELLED'].includes(row.orderStatus) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            disabled={cancellingOrders.has(row.orderId)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-red-600 bg-white hover:bg-red-50 transition-colors disabled:opacity-40"
                          >
                            {cancellingOrders.has(row.orderId) ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {cancellingOrders.has(row.orderId) ? 'Cancelling' : 'Cancel'}
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel this order? A refund will be issued. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Order</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleCancelOrder(row.orderId)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Cancel Order
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* No results after filtering */}
        {orderRows.length === 0 && orders.length > 0 && (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mb-3">
              <Search className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm">
              No orders match your search criteria.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
              disabled={pagination.page <= 1}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {(() => {
              const maxVisible = 5;
              let start = Math.max(1, pagination.page - Math.floor(maxVisible / 2));
              const end = Math.min(pagination.totalPages, start + maxVisible - 1);
              if (end - start + 1 < maxVisible) {
                start = Math.max(1, end - maxVisible + 1);
              }
              const pages: number[] = [];
              for (let i = start; i <= end; i++) pages.push(i);
              return pages.map((page) => (
                <button
                  key={page}
                  onClick={() => setPagination((prev) => ({ ...prev, page }))}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    page === pagination.page
                      ? 'bg-[#4379EE] text-white shadow-sm shadow-blue-500/20'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ));
            })()}
            <button
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
              disabled={pagination.page >= pagination.totalPages}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
