import { Navbar } from '@/components/layout/navbar';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function AdminPage() {
  try {
    await requireAuth();
    const session = await getServerSession(authOptions);

    if (session?.user?.role !== 'ADMIN') {
      redirect('/');
    }
  } catch {
    redirect('/auth/login?callbackUrl=/admin');
  }

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
        <AdminDashboard />
      </main>
    </>
  );
}
