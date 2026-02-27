'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IpPoolForm, type IpPoolRow } from './ip-pool-form'
import { AllocationDialog } from './allocation-dialog'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface IpPoolTableProps {
  data: IpPoolRow[]
  loading: boolean
  accessToken?: string | null
  onRefresh: () => void
}

export function IpPoolTable({ data, loading, accessToken, onRefresh }: IpPoolTableProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingPool, setEditingPool] = useState<IpPoolRow | null>(null)
  const [allocDialogOpen, setAllocDialogOpen] = useState(false)
  const [selectedPool, setSelectedPool] = useState<IpPoolRow | null>(null)

  const handleCreate = () => {
    setEditingPool(null)
    setFormOpen(true)
  }

  const handleEdit = (pool: IpPoolRow) => {
    setEditingPool(pool)
    setFormOpen(true)
  }

  const handleDelete = async (pool: IpPoolRow) => {
    if (!accessToken) return
    if (!confirm(`Delete pool "${pool.name}"? All allocations will be removed.`)) return

    try {
      const response = await fetch(`${apiUrl}/api/v1/ip-pool/${pool.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (response.ok) {
        onRefresh()
      }
    } catch {
      // Error handled silently
    }
  }

  const handleViewAllocations = (pool: IpPoolRow) => {
    setSelectedPool(pool)
    setAllocDialogOpen(true)
  }

  const handleFormSuccess = () => {
    setFormOpen(false)
    setEditingPool(null)
    onRefresh()
  }

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
          {data.length} pool{data.length !== 1 ? 's' : ''}
        </p>
        <Button
          onClick={handleCreate}
          size="sm"
          className="gap-2 bg-[#4379EE] hover:bg-[#3568d4] text-white"
        >
          <Plus className="w-4 h-4" />
          Create Pool
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">No IP pools configured</p>
          <p className="text-sm mt-1">Create a pool to start allocating IPs for VMs.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Pool Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">IP Range</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">CIDR</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Gateway</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Allocations</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((pool) => (
                <tr key={pool.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-4 font-medium text-gray-900">{pool.name}</td>
                  <td className="py-3 px-4 font-mono text-gray-600 text-xs">
                    {pool.startIp} — {pool.endIp}
                  </td>
                  <td className="py-3 px-4 text-gray-600">/{pool.cidr}</td>
                  <td className="py-3 px-4 font-mono text-gray-600 text-xs">{pool.gateway}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleViewAllocations(pool)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      {pool.allocationCount} allocated
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleViewAllocations(pool)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        title="View allocations"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(pool)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        title="Edit pool"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(pool)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete pool"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <IpPoolForm
        open={formOpen}
        pool={editingPool}
        accessToken={accessToken}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setFormOpen(false)
          setEditingPool(null)
        }}
      />

      <AllocationDialog
        open={allocDialogOpen}
        poolId={selectedPool?.id ?? null}
        poolName={selectedPool?.name ?? ''}
        accessToken={accessToken}
        onClose={() => {
          setAllocDialogOpen(false)
          setSelectedPool(null)
        }}
      />
    </div>
  )
}
