'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { IpPoolTable } from './components/ip-pool-table'
import type { IpPoolRow } from './components/ip-pool-form'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function AdminIpPoolPage() {
  const { accessToken, isLoading: authLoading } = useAuth()
  const [pools, setPools] = useState<IpPoolRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPools = useCallback(async () => {
    if (!accessToken) return
    try {
      setLoading(true)
      const response = await fetch(`${apiUrl}/api/v1/ip-pool`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (response.ok) {
        const data = await response.json()
        setPools(data.pools)
      }
    } catch {
      // Error handled silently
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (accessToken) {
      fetchPools()
    }
  }, [accessToken, fetchPools])

  if (authLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#4379EE] border-r-transparent"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#202224]">IP Pools</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage IP address pools for VM provisioning
          </p>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <IpPoolTable
          data={pools}
          loading={loading}
          accessToken={accessToken}
          onRefresh={fetchPools}
        />
      </div>
    </div>
  )
}
