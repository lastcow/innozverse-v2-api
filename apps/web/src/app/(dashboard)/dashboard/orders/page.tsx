import { OrdersTable } from '@/components/dashboard/orders-table';

export default function OrdersPage() {
  return (
    <div>
      <h1 className="font-serif text-4xl font-bold text-stone-900 mb-4">
        My Orders
      </h1>
      <p className="text-stone-600 mb-8">
        View and track your order history.
      </p>
      <OrdersTable />
    </div>
  )
}
