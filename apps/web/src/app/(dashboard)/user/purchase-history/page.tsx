import { OrdersTable } from '@/components/dashboard/orders-table';

export default function PurchaseHistoryPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-slate-900 mb-4">
        Purchase History
      </h1>
      <p className="text-slate-600 mb-8">
        View and track your order history.
      </p>
      <OrdersTable />
    </div>
  )
}
