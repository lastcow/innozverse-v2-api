'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Square, Cpu, MemoryStick, Copy, Check, Terminal } from 'lucide-react'
import { toggleUserVMStatus, type UserVM } from '@/app/actions/user-vms'
import { toast } from 'sonner'
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

const PROVISIONING_STATUSES = ['provisioning', 'cloning', 'configuring', 'starting']

function isProvisioning(status: string) {
  return PROVISIONING_STATUSES.includes(status)
}

function getProvisioningLabel(status: string) {
  switch (status) {
    case 'provisioning': return 'Provisioning...'
    case 'cloning': return 'Cloning...'
    case 'configuring': return 'Configuring...'
    case 'starting': return 'Starting...'
    default: return status
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="text-gray-400 hover:text-[#4379EE] transition-colors"
      title="Copy"
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
    </button>
  )
}

function formatMemory(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB`
  return `${mb} MB`
}

function VMCard({ vm }: { vm: UserVM }) {
  const [status, setStatus] = useState(vm.status)
  const [isPending, startTransition] = useTransition()
  const [confirmAction, setConfirmAction] = useState<'start' | 'stop' | null>(null)

  // Sync status when prop changes (from polling refresh)
  useEffect(() => {
    setStatus(vm.status)
  }, [vm.status])

  const isRunning = status === 'running'
  const isProvisioningState = isProvisioning(status)
  const isError = status === 'error'
  const username = vm.username || 'user'
  const internalStr = vm.ipAddress ? `ssh ${username}@${vm.ipAddress}` : null
  const internetStr = vm.publicIpAddress
    ? `ssh ${username}@${vm.publicIpAddress}${vm.port ? ` -p ${vm.port}` : ''}`
    : null

  const handleToggle = (action: 'start' | 'stop') => {
    startTransition(async () => {
      const result = await toggleUserVMStatus(vm.vmid, action)
      if (result.success) {
        setStatus(action === 'start' ? 'running' : 'stopped')
        toast.success(action === 'start' ? `${vm.name} started successfully` : `${vm.name} stopped successfully`)
      } else {
        toast.error(`Failed to ${action} ${vm.name}`)
      }
    })
  }

  // Status dot color
  const dotClass = isRunning
    ? 'bg-green-500'
    : isProvisioningState
      ? 'bg-blue-500 animate-pulse'
      : isError
        ? 'bg-red-500'
        : 'bg-gray-300'

  return (
    <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm flex items-center gap-4">
      {/* Status dot + Name */}
      <div className="flex items-center gap-2.5 min-w-0 shrink-0">
        <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#202224] truncate">{vm.name}</p>
          {vm.type && <p className="text-[11px] text-gray-400 leading-tight">{vm.type}</p>}
        </div>
      </div>

      {/* Resources — hidden on very small screens */}
      <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500 shrink-0">
        <span className="flex items-center gap-1">
          <Cpu className="w-3 h-3 text-gray-400" />
          {vm.cpuCores}
        </span>
        <span className="flex items-center gap-1">
          <MemoryStick className="w-3 h-3 text-gray-400" />
          {formatMemory(vm.memory)}
        </span>
      </div>

      {/* Connection string(s) */}
      {internalStr || internetStr ? (
        <div className="flex-1 min-w-0 hidden md:flex items-center gap-2">
          {internalStr && (
            <div className={`flex-1 min-w-0 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 ${internetStr ? 'bg-gray-50 border border-gray-200' : 'bg-gray-50'}`}>
              {internetStr && <span className="text-[9px] font-medium text-gray-400 uppercase shrink-0">Internal</span>}
              <Terminal className="w-3 h-3 text-gray-400 shrink-0" />
              <code className="text-[11px] text-gray-600 font-mono truncate">{internalStr}</code>
              <CopyButton text={internalStr} />
            </div>
          )}
          {internetStr && (
            <div className="flex-1 min-w-0 flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5">
              <span className="text-[9px] font-medium text-blue-400 uppercase shrink-0">Internet</span>
              <Terminal className="w-3 h-3 text-blue-400 shrink-0" />
              <code className="text-[11px] text-blue-600 font-mono truncate">{internetStr}</code>
              <CopyButton text={internetStr} />
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 min-w-0 hidden md:block" />
      )}

      {/* Credentials */}
      {(vm.username || vm.password) && (
        <div className="hidden lg:flex items-center gap-3 text-xs text-gray-500 shrink-0">
          {vm.username && (
            <span className="flex items-center gap-1">
              <span className="text-gray-400">user:</span>
              <span className="font-mono text-gray-600">{vm.username}</span>
              <CopyButton text={vm.username} />
            </span>
          )}
          {vm.password && (
            <span className="flex items-center gap-1">
              <span className="text-gray-400">pass:</span>
              <span className="font-mono text-gray-600">{vm.password}</span>
              <CopyButton text={vm.password} />
            </span>
          )}
        </div>
      )}

      {/* Action button / Provisioning status */}
      <div className="shrink-0 ml-auto">
        {isProvisioningState ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-blue-600 border border-blue-200 bg-blue-50 rounded-lg px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            {getProvisioningLabel(status)}
          </span>
        ) : isError ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-red-600 border border-red-200 bg-red-50 rounded-lg px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Error
          </span>
        ) : isRunning ? (
          <button
            onClick={() => setConfirmAction('stop')}
            disabled={isPending}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            <Square className="w-3 h-3" />
            {isPending ? 'Stopping' : 'Stop'}
          </button>
        ) : (
          <button
            onClick={() => setConfirmAction('start')}
            disabled={isPending}
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-[#4379EE] hover:bg-[#3568d4] rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            <Play className="w-3 h-3" />
            {isPending ? 'Starting' : 'Start'}
          </button>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'stop' ? 'Stop' : 'Start'} VM
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {confirmAction} <span className="font-medium text-gray-700">{vm.name}</span>?
              {confirmAction === 'stop' && ' Any unsaved work may be lost.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction) handleToggle(confirmAction)
                setConfirmAction(null)
              }}
              className={confirmAction === 'stop' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-[#4379EE] hover:bg-[#3568d4] text-white'}
            >
              {confirmAction === 'stop' ? 'Stop' : 'Start'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export function VMCardGrid({ initialVMs }: { initialVMs: UserVM[] }) {
  const router = useRouter()
  const [vms, setVms] = useState(initialVMs)

  // Sync when initialVMs prop changes (from server re-render)
  useEffect(() => {
    setVms(initialVMs)
  }, [initialVMs])

  // Auto-refresh while any VM is in a provisioning state
  const hasProvisioning = vms.some((vm) => isProvisioning(vm.status))

  useEffect(() => {
    if (!hasProvisioning) return

    const interval = setInterval(() => {
      router.refresh()
    }, 5000)

    return () => clearInterval(interval)
  }, [hasProvisioning, router])

  if (vms.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
        <Terminal className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-500">No VMs assigned</p>
        <p className="text-xs text-gray-400 mt-1">
          You don&apos;t have any virtual machines assigned yet.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {vms.map((vm) => (
        <VMCard key={vm.id} vm={vm} />
      ))}
    </div>
  )
}
