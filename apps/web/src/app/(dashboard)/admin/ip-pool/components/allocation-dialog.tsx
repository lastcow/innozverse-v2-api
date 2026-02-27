'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Allocation {
  id: string
  ipAddress: string
  vmid: number
  poolId: string
  createdAt: string
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface AllocationDialogProps {
  open: boolean
  poolId: string | null
  poolName: string
  accessToken?: string | null
  onClose: () => void
}

export function AllocationDialog({ open, poolId, poolName, accessToken, onClose }: AllocationDialogProps) {
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [loading, setLoading] = useState(false)

  const fetchAllocations = useCallback(async () => {
    if (!accessToken || !poolId) return
    try {
      setLoading(true)
      const response = await fetch(`${apiUrl}/api/v1/ip-pool/${poolId}/allocations`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (response.ok) {
        const data = await response.json()
        setAllocations(data.allocations)
      }
    } catch {
      // Error handled silently
    } finally {
      setLoading(false)
    }
  }, [accessToken, poolId])

  useEffect(() => {
    if (open && poolId) {
      fetchAllocations()
    }
  }, [open, poolId, fetchAllocations])

  const handleRelease = async (allocationId: string) => {
    if (!accessToken) return
    try {
      const response = await fetch(`${apiUrl}/api/v1/ip-pool/allocations/${allocationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (response.ok) {
        setAllocations((prev) => prev.filter((a) => a.id !== allocationId))
      }
    } catch {
      // Error handled silently
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Allocations — {poolName}</DialogTitle>
          <DialogDescription>
            IP addresses currently allocated from this pool.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#4379EE] border-r-transparent"></div>
          </div>
        ) : allocations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No allocations in this pool.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">IP Address</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">VMID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Created</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((alloc) => (
                  <tr key={alloc.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-mono text-gray-900">{alloc.ipAddress}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {alloc.vmid === -1 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                          Pending
                        </span>
                      ) : (
                        alloc.vmid
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {new Date(alloc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleRelease(alloc.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Release
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
