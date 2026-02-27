'use client'

import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface StorageRow {
  id: string
  name: string
  node: string
  type: string | null
  totalBytes: string
  usedBytes: string
  availBytes: string
  active: boolean
  vmable: boolean
  createdAt: string
  updatedAt: string
}

interface StorageTableProps {
  data: StorageRow[]
  loading: boolean
  syncing: boolean
  onSync: () => void
  onToggleVmable: (id: string, vmable: boolean) => void
  onToggleActive: (id: string, active: boolean) => void
}

function formatBytes(bytesStr: string): string {
  const bytes = Number(bytesStr)
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(1)} ${units[i]}`
}

function usagePercent(used: string, total: string): number {
  const t = Number(total)
  if (t === 0) return 0
  return Math.round((Number(used) / t) * 100)
}

export function StorageTable({
  data,
  loading,
  syncing,
  onSync,
  onToggleVmable,
  onToggleActive,
}: StorageTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#4379EE] border-r-transparent"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {data.length} storage pool{data.length !== 1 ? 's' : ''}
        </p>
        <Button
          onClick={onSync}
          disabled={syncing}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync from Proxmox'}
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">No storage pools found</p>
          <p className="text-sm mt-1">Click &quot;Sync from Proxmox&quot; to fetch storage pools.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Node</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Capacity</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Used</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Available</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Usage</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Active</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">VM Provisioning</th>
              </tr>
            </thead>
            <tbody>
              {data.map((storage) => {
                const pct = usagePercent(storage.usedBytes, storage.totalBytes)
                const barColor = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500'

                return (
                  <tr key={storage.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-medium text-gray-900">{storage.name}</td>
                    <td className="py-3 px-4 text-gray-600">{storage.node}</td>
                    <td className="py-3 px-4 text-gray-600">{storage.type || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{formatBytes(storage.totalBytes)}</td>
                    <td className="py-3 px-4 text-gray-600">{formatBytes(storage.usedBytes)}</td>
                    <td className="py-3 px-4 text-gray-600">{formatBytes(storage.availBytes)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${barColor}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-10">{pct}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onToggleActive(storage.id, !storage.active)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          storage.active
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {storage.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onToggleVmable(storage.id, !storage.vmable)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          storage.vmable
                            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {storage.vmable ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
