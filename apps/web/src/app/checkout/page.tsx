import { Navbar } from '@/components/layout/navbar';
import { CheckoutForm } from '@/components/checkout/checkout-form';
import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function CheckoutPage() {
  try {
    await requireAuth();
  } catch {
    redirect('/auth/login?callbackUrl=/checkout');
  }

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
        <CheckoutForm />
      </main>
    </>
  );
}
