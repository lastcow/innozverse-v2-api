import { Navbar } from '@/components/layout/navbar';
import { OrderDetail } from '@/components/orders/order-detail';
import { requireAuth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  try {
    await requireAuth();
  } catch {
    redirect(`/auth/login?callbackUrl=/orders/${params.id}`);
  }

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OrderDetail orderId={params.id} />
      </main>
    </>
  );
}
