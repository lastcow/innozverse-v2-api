import { Navbar } from '@/components/layout/navbar';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  try {
    const session = await auth();

    if (!session?.user) {
      redirect('/auth/login?callbackUrl=/admin');
    }

    if (session.user.role !== 'ADMIN') {
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
