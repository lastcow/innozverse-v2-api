import { OrdersTable } from '@/components/dashboard/orders-table';

export default function PurchaseHistoryPage() {
  return (
    <div>
      <h1 className="font-serif text-4xl font-bold text-stone-900 mb-4">
        Purchase History
      </h1>
      <p className="text-stone-600 mb-8">
        View and track your order history.
      </p>
      <OrdersTable />
    </div>
  )
}
