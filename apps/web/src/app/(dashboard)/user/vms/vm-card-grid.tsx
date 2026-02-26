'use client'

import { useState, useTransition } from 'react'
import { Play, Square, Cpu, MemoryStick, Copy, Check, Terminal } from 'lucide-react'
import { toggleUserVMStatus, type UserVM } from '@/app/actions/user-vms'

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

  const isRunning = status === 'running'
  const connectionIp = vm.publicIpAddress || vm.ipAddress
  const connectionStr = connectionIp
    ? `ssh ${vm.username || 'user'}@${connectionIp}${vm.port ? ` -p ${vm.port}` : ''}`
    : null

  const handleToggle = (action: 'start' | 'stop') => {
    startTransition(async () => {
      const result = await toggleUserVMStatus(vm.vmid, action)
      if (result.success) {
        setStatus(action === 'start' ? 'running' : 'stopped')
      }
    })
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm flex items-center gap-4">
      {/* Status dot + Name */}
      <div className="flex items-center gap-2.5 min-w-0 shrink-0">
        <span className={`w-2 h-2 rounded-full shrink-0 ${isRunning ? 'bg-green-500' : 'bg-gray-300'}`} />
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

      {/* Connection string */}
      {connectionStr ? (
        <div className="flex-1 min-w-0 hidden md:flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5">
          <Terminal className="w-3 h-3 text-gray-400 shrink-0" />
          <code className="text-[11px] text-gray-600 font-mono truncate">{connectionStr}</code>
          <CopyButton text={connectionStr} />
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

      {/* Action button */}
      <div className="shrink-0 ml-auto">
        {isRunning ? (
          <button
            onClick={() => handleToggle('stop')}
            disabled={isPending}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            <Square className="w-3 h-3" />
            {isPending ? 'Stopping' : 'Stop'}
          </button>
        ) : (
          <button
            onClick={() => handleToggle('start')}
            disabled={isPending}
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-[#4379EE] hover:bg-[#3568d4] rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            <Play className="w-3 h-3" />
            {isPending ? 'Starting' : 'Start'}
          </button>
        )}
      </div>
    </div>
  )
}

export function VMCardGrid({ initialVMs }: { initialVMs: UserVM[] }) {
  if (initialVMs.length === 0) {
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
      {initialVMs.map((vm) => (
        <VMCard key={vm.id} vm={vm} />
      ))}
    </div>
  )
}
