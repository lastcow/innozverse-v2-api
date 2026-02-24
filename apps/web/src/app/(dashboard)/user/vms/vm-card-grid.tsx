'use client'

import { useState, useTransition } from 'react'
import { Play, Square, Cpu, MemoryStick, Copy, Check, Terminal } from 'lucide-react'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toggleUserVMStatus, type UserVM } from '@/app/actions/user-vms'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="text-gray-400 hover:text-[#4379EE] transition-colors p-1"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
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
    <Card className="bg-white shadow-sm border border-gray-100 rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <h3 className="text-base font-semibold text-[#202224]">{vm.name}</h3>
          {vm.type && <p className="text-xs text-gray-400 mt-0.5">{vm.type}</p>}
        </div>
        <Badge
          className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
            isRunning
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-gray-50 text-gray-500 border-gray-200'
          }`}
          variant="outline"
        >
          {isRunning ? 'Running' : 'Stopped'}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Resources */}
        <div className="flex gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-gray-400" />
            <span>{vm.cpuCores} {vm.cpuCores === 1 ? 'Core' : 'Cores'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MemoryStick className="w-4 h-4 text-gray-400" />
            <span>{formatMemory(vm.memory)}</span>
          </div>
        </div>

        {/* Connection */}
        {connectionStr && (
          <div className="bg-gray-50 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Terminal className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Connection</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <code className="text-xs text-gray-700 font-mono truncate">{connectionStr}</code>
              <CopyButton text={connectionStr} />
            </div>
          </div>
        )}

        {/* Credentials */}
        {(vm.username || vm.password) && (
          <div className="flex gap-4 text-sm">
            {vm.username && (
              <div className="flex items-center gap-1">
                <span className="text-gray-400 text-xs">User:</span>
                <span className="text-gray-700 text-xs font-mono">{vm.username}</span>
                <CopyButton text={vm.username} />
              </div>
            )}
            {vm.password && (
              <div className="flex items-center gap-1">
                <span className="text-gray-400 text-xs">Pass:</span>
                <span className="text-gray-700 text-xs font-mono">{vm.password}</span>
                <CopyButton text={vm.password} />
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t border-gray-50">
        {isRunning ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-gray-600 hover:text-red-600 hover:border-red-200"
            onClick={() => handleToggle('stop')}
            disabled={isPending}
          >
            <Square className="w-4 h-4 mr-2" />
            {isPending ? 'Stopping...' : 'Stop'}
          </Button>
        ) : (
          <Button
            size="sm"
            className="w-full bg-[#4379EE] hover:bg-[#3568d4] text-white"
            onClick={() => handleToggle('start')}
            disabled={isPending}
          >
            <Play className="w-4 h-4 mr-2" />
            {isPending ? 'Starting...' : 'Start'}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export function VMCardGrid({ initialVMs }: { initialVMs: UserVM[] }) {
  if (initialVMs.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Terminal className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-base font-medium text-gray-700 mb-1">No VMs assigned</h3>
        <p className="text-sm text-gray-400">
          You don&apos;t have any virtual machines assigned to your account yet.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {initialVMs.map((vm) => (
        <VMCard key={vm.id} vm={vm} />
      ))}
    </div>
  )
}
