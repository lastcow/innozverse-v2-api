'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface AdminStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: string;
  totalUsers: number;
}

export function AdminStats() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/v1/admin/stats`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch stats');
        }

        setStats(data.stats);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) {
      fetchStats();
    }
  }, [accessToken]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Platform Statistics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm p-6 text-white">
          <h3 className="text-sm font-medium opacity-90 mb-2">Total Revenue</h3>
          <p className="text-4xl font-bold">${parseFloat(stats.totalRevenue).toFixed(2)}</p>
        </div>

        {/* Total Orders */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 text-white">
          <h3 className="text-sm font-medium opacity-90 mb-2">Total Orders</h3>
          <p className="text-4xl font-bold">{stats.totalOrders}</p>
          <p className="text-sm opacity-90 mt-2">{stats.pendingOrders} pending</p>
        </div>

        {/* Total Products */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-sm p-6 text-white">
          <h3 className="text-sm font-medium opacity-90 mb-2">Total Products</h3>
          <p className="text-4xl font-bold">{stats.totalProducts}</p>
          <p className="text-sm opacity-90 mt-2">{stats.activeProducts} active</p>
        </div>

        {/* Total Users */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 text-white">
          <h3 className="text-sm font-medium opacity-90 mb-2">Total Users</h3>
          <p className="text-4xl font-bold">{stats.totalUsers}</p>
        </div>
      </div>
    </div>
  );
}
