import { Navbar } from '@/components/layout/navbar';
import { OrdersList } from '@/components/orders/orders-list';
import { requireAuth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function OrdersPage() {
  try {
    await requireAuth();
  } catch {
    redirect('/auth/login?callbackUrl=/orders');
  }

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
        <OrdersList />
      </main>
    </>
  );
}
