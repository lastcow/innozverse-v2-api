'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { StorageTable, type StorageRow } from './components/storage-table'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function AdminStoragePage() {
  const { accessToken, isLoading: authLoading } = useAuth()
  const [storages, setStorages] = useState<StorageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const fetchStorages = useCallback(async () => {
    if (!accessToken) return
    try {
      setLoading(true)
      const response = await fetch(`${apiUrl}/api/v1/storage`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (response.ok) {
        const data = await response.json()
        setStorages(data.storages)
      }
    } catch {
      // Error handled silently
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  const handleSync = useCallback(async () => {
    if (!accessToken) return
    try {
      setSyncing(true)
      const response = await fetch(`${apiUrl}/api/v1/storage/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (response.ok) {
        const data = await response.json()
        setStorages(data.storages)
      }
    } catch {
      // Error handled silently
    } finally {
      setSyncing(false)
    }
  }, [accessToken])

  const handleToggleVmable = useCallback(async (id: string, vmable: boolean) => {
    if (!accessToken) return
    try {
      const response = await fetch(`${apiUrl}/api/v1/storage/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ vmable }),
      })
      if (response.ok) {
        setStorages(prev => prev.map(s => s.id === id ? { ...s, vmable } : s))
      }
    } catch {
      // Error handled silently
    }
  }, [accessToken])

  const handleToggleActive = useCallback(async (id: string, active: boolean) => {
    if (!accessToken) return
    try {
      const response = await fetch(`${apiUrl}/api/v1/storage/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ active }),
      })
      if (response.ok) {
        setStorages(prev => prev.map(s => s.id === id ? { ...s, active } : s))
      }
    } catch {
      // Error handled silently
    }
  }, [accessToken])

  useEffect(() => {
    if (accessToken) {
      fetchStorages()
    }
  }, [accessToken, fetchStorages])

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
          <h1 className="text-2xl font-bold text-[#202224]">Storage Pools</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage Proxmox storage pools for VM provisioning
          </p>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <StorageTable
          data={storages}
          loading={loading}
          syncing={syncing}
          onSync={handleSync}
          onToggleVmable={handleToggleVmable}
          onToggleActive={handleToggleActive}
        />
      </div>
    </div>
  )
}
