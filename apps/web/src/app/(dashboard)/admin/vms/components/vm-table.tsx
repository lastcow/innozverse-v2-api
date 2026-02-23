'use client'

import { Play, Square, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface VM {
  vmid: number
  name: string
  status: string
  cpus: number
  maxmem: number
}

interface VmTableProps {
  vms: VM[]
  loading: boolean
  onToggleStatus: (vmid: number, action: 'start' | 'stop') => void
  onDelete: (vmid: number) => void
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'running':
      return { label: 'Running', color: 'bg-green-50 text-green-600 border-0' }
    case 'stopped':
      return { label: 'Stopped', color: 'bg-gray-50 text-gray-600 border-0' }
    default:
      return { label: status, color: 'bg-yellow-50 text-yellow-600 border-0' }
  }
}

function formatMemory(bytes: number) {
  const gb = bytes / (1024 * 1024 * 1024)
  if (gb >= 1) return `${gb.toFixed(1)} GB`
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(0)} MB`
}

export function VmTable({ vms, loading, onToggleStatus, onDelete }: VmTableProps) {
  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#4379EE] border-r-transparent"></div>
        <p className="mt-4 text-gray-500">Loading virtual machines...</p>
      </div>
    )
  }

  if (vms.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500 text-lg">No virtual machines found.</p>
        <p className="text-gray-400 text-sm mt-2">
          Click &ldquo;Clone VM&rdquo; to clone your first virtual machine.
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-gray-100 hover:bg-transparent">
          <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">VMID</TableHead>
          <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Name</TableHead>
          <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Status</TableHead>
          <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">CPU Cores</TableHead>
          <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider">Memory</TableHead>
          <TableHead className="text-gray-400 font-medium text-xs uppercase tracking-wider text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vms.map((vm) => {
          const status = getStatusBadge(vm.status)
          const isRunning = vm.status === 'running'
          return (
            <TableRow key={vm.vmid} className="border-gray-50 hover:bg-gray-50/50">
              <TableCell className="font-semibold text-[#202224]">
                {vm.vmid}
              </TableCell>
              <TableCell className="font-semibold text-[#202224]">
                {vm.name}
              </TableCell>
              <TableCell>
                <Badge className={status.color}>{status.label}</Badge>
              </TableCell>
              <TableCell className="text-gray-500">{vm.cpus}</TableCell>
              <TableCell className="text-gray-500">{formatMemory(vm.maxmem)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onToggleStatus(vm.vmid, isRunning ? 'stop' : 'start')}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isRunning
                        ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                    title={isRunning ? 'Stop VM' : 'Start VM'}
                  >
                    {isRunning ? (
                      <Square className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Virtual Machine</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete VM &ldquo;{vm.name}&rdquo; (ID: {vm.vmid})? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(vm.vmid)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
