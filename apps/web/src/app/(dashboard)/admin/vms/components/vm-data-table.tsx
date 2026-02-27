'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import {
  Server,
  Cpu,
  MemoryStick,
  Network,
  Route,
  User,
  UserPlus,
  UserX,
  KeyRound,
  Copy,
  Play,
  Square,
  Trash2,
  MoreHorizontal,
  Monitor,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Check,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { VmForm } from './vm-form'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface AssignedUser {
  id: string
  email: string
  name: string
}

export interface VMRow {
  id: string
  vmid: number
  name: string
  type: string | null
  node: string
  status: string
  memory: number
  cpuCores: number
  ipAddress: string | null
  publicIpAddress: string | null
  port: number | null
  gateway: string | null
  username: string | null
  password: string | null
  userId: string | null
  assignedUser: AssignedUser | null
  subscription: { planName: string; status: string; billingPeriod: string } | null
  createdAt: string
}

const columnHelper = createColumnHelper<VMRow>()

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
    </button>
  )
}

const PROVISIONING_STATUSES = ['provisioning', 'cloning', 'configuring', 'starting']

function StatusDot({ status }: { status: string }) {
  const isProvisioningState = PROVISIONING_STATUSES.includes(status)
  const isError = status === 'error'

  const color = status === 'running'
    ? 'bg-green-500'
    : isProvisioningState
      ? 'bg-blue-500 animate-pulse'
      : isError
        ? 'bg-red-500'
        : 'bg-gray-400'

  const label = isProvisioningState
    ? `${status.charAt(0).toUpperCase() + status.slice(1)}...`
    : status

  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className={`text-sm font-medium capitalize ${isError ? 'text-red-600' : isProvisioningState ? 'text-blue-600' : ''}`}>
        {label}
      </span>
    </div>
  )
}

const columns = [
  columnHelper.accessor('name', {
    header: 'VM',
    cell: (info) => (
      <div className="flex flex-col">
        <span className="font-semibold text-[#202224]">{info.getValue()}</span>
        <span className="text-xs text-muted-foreground">ID: {info.row.original.vmid}</span>
      </div>
    ),
    filterFn: (row, _columnId, filterValue: string) => {
      const search = filterValue.toLowerCase()
      return (
        row.original.name.toLowerCase().includes(search) ||
        String(row.original.vmid).includes(search) ||
        (row.original.ipAddress?.toLowerCase().includes(search) ?? false) ||
        (row.original.username?.toLowerCase().includes(search) ?? false)
      )
    },
  }),
  columnHelper.accessor('type', {
    header: 'Type',
    cell: (info) => {
      const type = info.getValue()
      if (!type) return <span className="text-sm text-gray-400">-</span>
      const color = type === 'Ubuntu' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
      return (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
          {type}
        </span>
      )
    },
  }),
  columnHelper.accessor('node', {
    header: 'Node',
    cell: (info) => (
      <div className="flex items-center gap-1.5 text-sm text-gray-600">
        <Server size={14} className="text-gray-400" />
        {info.getValue()}
      </div>
    ),
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => <StatusDot status={info.getValue()} />,
    filterFn: 'equals',
  }),
  columnHelper.display({
    id: 'resources',
    header: 'Resources',
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5 text-sm text-gray-600">
        <div className="flex items-center gap-1.5">
          <Cpu size={14} className="text-gray-400" />
          <span>{row.original.cpuCores} Cores</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MemoryStick size={14} className="text-gray-400" />
          <span>{row.original.memory} MB</span>
        </div>
      </div>
    ),
  }),
  columnHelper.display({
    id: 'network',
    header: 'Network',
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5 text-sm">
        <div className="flex items-center gap-1.5 text-gray-600">
          <Network size={14} className="text-gray-400" />
          <span>{row.original.ipAddress || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Route size={14} className="text-gray-300" />
          <span>{row.original.gateway || 'N/A'}</span>
        </div>
      </div>
    ),
  }),
  columnHelper.display({
    id: 'credentials',
    header: 'Credentials',
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5 text-sm text-gray-600">
        <div className="flex items-center gap-1.5">
          <User size={14} className="text-gray-400" />
          <span>{row.original.username || '-'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <KeyRound size={14} className="text-gray-400" />
          <span className="font-mono text-xs">{row.original.password ? '********' : '-'}</span>
          {row.original.password && <CopyButton text={row.original.password} />}
        </div>
      </div>
    ),
  }),
  columnHelper.display({
    id: 'assignedTo',
    header: 'Assigned To',
    cell: ({ row }) => {
      const vm = row.original
      const user = vm.assignedUser
      if (!user) return <span className="text-sm text-gray-400">Unassigned</span>
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-[#202224]">{user.name}</span>
          <span className="text-xs text-muted-foreground">{user.email}</span>
          {(vm.publicIpAddress || vm.port) && (
            <span className="text-[11px] text-gray-400 font-mono">
              {vm.publicIpAddress}{vm.port ? `:${vm.port}` : ''}
            </span>
          )}
        </div>
      )
    },
  }),
  columnHelper.display({
    id: 'subscription',
    header: 'Subscription',
    cell: ({ row }) => {
      const sub = row.original.subscription
      if (!sub) return <span className="text-sm text-gray-400">-</span>
      const statusColor = sub.status === 'ACTIVE'
        ? 'bg-green-100 text-green-700'
        : sub.status === 'CANCELLED'
          ? 'bg-red-100 text-red-700'
          : 'bg-gray-100 text-gray-600'
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-[#202224]">{sub.planName}</span>
          <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full w-fit ${statusColor}`}>
            {sub.status}
          </span>
        </div>
      )
    },
  }),
  columnHelper.display({
    id: 'actions',
    header: '',
    cell: () => null,
  }),
]

interface VMDataTableProps {
  data: VMRow[]
  loading: boolean
  accessToken: string | undefined
  onRefresh: () => void
}

export function VMDataTable({ data, loading, accessToken, onRefresh }: VMDataTableProps) {
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<VMRow | null>(null)
  const [assignTarget, setAssignTarget] = useState<VMRow | null>(null)

  const statusFilter = useMemo(
    () => (columnFilters.find((f) => f.id === 'status')?.value as string) ?? 'all',
    [columnFilters]
  )

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, columnFilters },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    globalFilterFn: (row, _columnId, filterValue: string) => {
      const search = filterValue.toLowerCase()
      return (
        row.original.name.toLowerCase().includes(search) ||
        String(row.original.vmid).includes(search) ||
        (row.original.ipAddress?.toLowerCase().includes(search) ?? false) ||
        (row.original.username?.toLowerCase().includes(search) ?? false) ||
        row.original.node.toLowerCase().includes(search)
      )
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  const handleToggleStatus = async (vm: VMRow) => {
    const action = vm.status === 'running' ? 'stop' : 'start'
    try {
      const response = await fetch(`${apiUrl}/api/v1/vms/${vm.vmid}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ action }),
      })
      if (response.ok) {
        toast.success(`VM ${action === 'start' ? 'started' : 'stopped'} successfully.`)
        onRefresh()
      } else {
        const data = await response.json()
        toast.error(data.error || `Failed to ${action} VM`)
      }
    } catch {
      toast.error(`Failed to ${action} VM`)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const response = await fetch(`${apiUrl}/api/v1/vms/${deleteTarget.vmid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (response.ok) {
        toast.success('VM deleted.')
        setDeleteTarget(null)
        onRefresh()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete VM')
      }
    } catch {
      toast.error('Failed to delete VM')
    }
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    onRefresh()
  }

  const handleStatusFilterChange = (value: string) => {
    if (value === 'all') {
      setColumnFilters((prev) => prev.filter((f) => f.id !== 'status'))
    } else {
      setColumnFilters((prev) => [
        ...prev.filter((f) => f.id !== 'status'),
        { id: 'status', value },
      ])
    }
  }

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#4379EE] border-r-transparent"></div>
        <p className="mt-4 text-gray-500">Loading virtual machines...</p>
      </div>
    )
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search VMs..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 rounded-xl border-gray-200"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-[140px] rounded-xl border-gray-200">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="stopped">Stopped</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-[#4379EE] hover:bg-[#3568d4] text-white rounded-xl px-5"
        >
          <Copy className="w-4 h-4 mr-2" />
          Clone VM
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80">
              {table.getHeaderGroups().map((headerGroup) =>
                headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <p className="text-gray-500 text-lg">No virtual machines found.</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Click &ldquo;Clone VM&rdquo; to clone your first virtual machine.
                  </p>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => {
                    if (cell.column.id === 'actions') {
                      return (
                        <td key={cell.id} className="px-5 py-4 text-right">
                          <ActionsCell
                            vm={row.original}
                            onToggleStatus={handleToggleStatus}
                            onDelete={setDeleteTarget}
                            onAssign={setAssignTarget}
                          />
                        </td>
                      )
                    }
                    return (
                      <td key={cell.id} className="px-5 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
            {' '}-{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}
            {' '}of {table.getFilteredRowModel().rows.length} VMs
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-lg"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-lg"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600 px-3">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-lg"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-lg"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Clone VM Dialog */}
      <VmForm
        open={isFormOpen}
        accessToken={accessToken}
        onSuccess={handleFormSuccess}
        onCancel={() => setIsFormOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Virtual Machine</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete VM &ldquo;{deleteTarget?.name}&rdquo; (ID:{' '}
              {deleteTarget?.vmid})? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign VM Dialog */}
      <VmAssignDialog
        open={!!assignTarget}
        vm={assignTarget}
        accessToken={accessToken}
        onClose={() => setAssignTarget(null)}
        onSuccess={() => {
          setAssignTarget(null)
          onRefresh()
        }}
      />
    </>
  )
}

function ActionsCell({
  vm,
  onToggleStatus,
  onDelete,
  onAssign,
}: {
  vm: VMRow
  onToggleStatus: (vm: VMRow) => void
  onDelete: (vm: VMRow) => void
  onAssign: (vm: VMRow) => void
}) {
  const isRunning = vm.status === 'running'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
          <MoreHorizontal className="w-4 h-4 text-gray-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {isRunning ? (
          <DropdownMenuItem onClick={() => onToggleStatus(vm)}>
            <Square className="w-4 h-4 mr-2 text-yellow-600" />
            Stop
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onToggleStatus(vm)}>
            <Play className="w-4 h-4 mr-2 text-green-600" />
            Start
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => {
            if (vm.ipAddress) {
              window.open(`https://${vm.ipAddress}:6080/vnc.html`, '_blank')
            } else {
              toast.error('No IP address assigned to this VM')
            }
          }}
        >
          <Monitor className="w-4 h-4 mr-2 text-blue-600" />
          Console
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onAssign(vm)}>
          {vm.assignedUser ? (
            <>
              <UserX className="w-4 h-4 mr-2 text-orange-600" />
              Reassign
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-2 text-[#4379EE]" />
              Assign
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(vm)}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ============================================================
// Assign Dialog
// ============================================================

interface SearchUser {
  id: string
  email: string
  fname: string | null
  lname: string | null
}

function VmAssignDialog({
  open,
  vm,
  accessToken,
  onClose,
  onSuccess,
}: {
  open: boolean
  vm: VMRow | null
  accessToken: string | undefined
  onClose: () => void
  onSuccess: () => void
}) {
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<SearchUser[]>([])
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [publicIp, setPublicIp] = useState('')
  const [port, setPort] = useState('')

  // Reset state when dialog opens
  useEffect(() => {
    if (open && vm) {
      setSearch('')
      setUsers([])
      setSelectedUserId(vm.userId ?? null)
      setPublicIp(vm.publicIpAddress ?? '')
      setPort(vm.port != null ? String(vm.port) : '')
    }
  }, [open, vm])

  const searchUsers = useCallback(async (query: string) => {
    if (!accessToken || query.length < 2) {
      setUsers([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch(
        `${apiUrl}/api/v1/admin/users?search=${encodeURIComponent(query)}&limit=10`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users ?? [])
      }
    } catch {
      // silent
    } finally {
      setSearching(false)
    }
  }, [accessToken])

  // Debounced search
  useEffect(() => {
    if (search.length < 2) {
      setUsers([])
      return
    }
    const timer = setTimeout(() => searchUsers(search), 300)
    return () => clearTimeout(timer)
  }, [search, searchUsers])

  const hasChanges = () => {
    if (!vm) return false
    if (selectedUserId !== (vm.userId ?? null)) return true
    if (publicIp !== (vm.publicIpAddress ?? '')) return true
    if (port !== (vm.port != null ? String(vm.port) : '')) return true
    return false
  }

  const handleSave = async () => {
    if (!vm) return
    setSaving(true)
    try {
      const res = await fetch(`${apiUrl}/api/v1/vms/${vm.vmid}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId: selectedUserId,
          publicIpAddress: publicIp || null,
          port: port ? parseInt(port, 10) : null,
        }),
      })
      if (res.ok) {
        toast.success('VM updated successfully.')
        onSuccess()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update VM')
      }
    } catch {
      toast.error('Failed to update VM')
    } finally {
      setSaving(false)
    }
  }

  const getUserDisplayName = (u: SearchUser) => {
    const name = [u.fname, u.lname].filter(Boolean).join(' ')
    return name || u.email
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#202224]">
            Edit VM Assignment
          </DialogTitle>
          <DialogDescription>
            Configure &ldquo;{vm?.name}&rdquo; (ID: {vm?.vmid}) — assign to a user and set public connection details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* ── Connection Details ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Public Connection
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Public IP Address</label>
                <Input
                  placeholder="e.g. 203.0.113.10"
                  value={publicIp}
                  onChange={(e) => setPublicIp(e.target.value)}
                  className="rounded-xl border-gray-200"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">SSH Port</label>
                <Input
                  placeholder="e.g. 22"
                  type="number"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="rounded-xl border-gray-200"
                />
              </div>
            </div>
            {vm?.ipAddress && (
              <p className="text-[11px] text-gray-400">
                Internal IP: {vm.ipAddress}
              </p>
            )}
          </div>

          {/* ── User Assignment ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Assign to User
            </p>

            {/* Current assignment */}
            {vm?.assignedUser && selectedUserId === vm.userId && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#202224]">{vm.assignedUser.name}</p>
                  <p className="text-xs text-gray-500">{vm.assignedUser.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => setSelectedUserId(null)}
                >
                  <UserX className="w-3.5 h-3.5 mr-1" />
                  Unassign
                </Button>
              </div>
            )}

            {/* Unassigned indicator when user was cleared */}
            {!selectedUserId && vm?.assignedUser && (
              <div className="bg-orange-50 border border-orange-100 rounded-xl px-3 py-2.5 text-sm text-orange-700">
                Will be unassigned on save
              </div>
            )}

            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search users by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl border-gray-200"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
              )}
            </div>

            {/* User results */}
            {users.length > 0 && (
              <div className="border border-gray-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-gray-100">
                {users.map((u) => {
                  const isSelected = selectedUserId === u.id
                  return (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUserId(u.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                        isSelected ? 'bg-[#4379EE] text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {(u.fname?.[0] ?? u.email[0] ?? '?').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#202224] truncate">{getUserDisplayName(u)}</p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#4379EE] shrink-0" />}
                    </button>
                  )
                })}
              </div>
            )}

            {search.length >= 2 && !searching && users.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-3">No users found.</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="rounded-xl border-gray-200">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges()}
            className="bg-[#4379EE] hover:bg-[#3568d4] text-white rounded-xl"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
