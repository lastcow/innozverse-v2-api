import { Navbar } from '@/components/layout/navbar';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  try {
    await requireAuth();
  } catch {
    redirect('/auth/login?callbackUrl=/dashboard');
  }

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Dashboard</h1>
        <DashboardContent />
      </main>
    </>
  );
}
