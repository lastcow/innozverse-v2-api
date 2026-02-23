'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { VMDataTable, type VMRow } from './components/vm-data-table'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function AdminVMsPage() {
  const { accessToken, isLoading: authLoading } = useAuth()
  const [vms, setVms] = useState<VMRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchVMs = useCallback(async () => {
    if (!accessToken) return
    try {
      setLoading(true)

      // Sync from Proxmox first
      await fetch(`${apiUrl}/api/v1/vms/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      // Then fetch from DB
      const response = await fetch(`${apiUrl}/api/v1/vms`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (response.ok) {
        const data = await response.json()
        setVms(data.vms)
      }
    } catch {
      // Error handled silently
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (accessToken) {
      fetchVMs()
    }
  }, [accessToken, fetchVMs])

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
          <h1 className="text-2xl font-bold text-[#202224]">Virtual Machines</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage Proxmox virtual machines
          </p>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <VMDataTable
          data={vms}
          loading={loading}
          accessToken={accessToken}
          onRefresh={fetchVMs}
        />
      </div>
    </div>
  )
}
