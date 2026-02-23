'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const cloneSchema = z.object({
  template: z.enum(['ubuntu', 'kali']),
  name: z.string().min(1, 'Name is required').max(128, 'Name must be less than 128 characters'),
  storage: z.string().min(1, 'Storage is required'),
  memory: z.coerce.number().int().min(512, 'Memory must be at least 512 MB'),
  cores: z.coerce.number().int().min(1, 'At least 1 core required').max(128, 'Max 128 cores'),
  ciuser: z.string().optional(),
  cipassword: z.string().optional(),
  ip: z.string().optional(),
  subnet: z.string().optional(),
  gateway: z.string().optional(),
})

type CloneFormData = z.infer<typeof cloneSchema>

type Phase = 'form' | 'cloning' | 'configuring' | 'done' | 'error'

interface VmFormProps {
  open: boolean
  accessToken: string | undefined
  onSuccess: () => void
  onCancel: () => void
}

export function VmForm({ open, accessToken, onSuccess, onCancel }: VmFormProps) {
  const [phase, setPhase] = useState<Phase>('form')
  const [progress, setProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const form = useForm<CloneFormData>({
    resolver: zodResolver(cloneSchema),
    defaultValues: {
      template: 'ubuntu',
      name: '',
      storage: 'local-lvm',
      memory: 2048,
      cores: 2,
      ciuser: '',
      cipassword: '',
      ip: '',
      subnet: '20',
      gateway: '',
    },
  })

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    return cleanup
  }, [cleanup])

  useEffect(() => {
    if (!open) {
      cleanup()
      setPhase('form')
      setProgress(0)
      setErrorMessage('')
      form.reset()
    }
  }, [open, cleanup, form])

  const authHeaders = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  }

  const onSubmit = async (data: CloneFormData) => {
    setPhase('cloning')
    setProgress(0)

    try {
      const cloneRes = await fetch(`${apiUrl}/api/v1/vms/clone`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: data.name,
          template: data.template,
          storage: data.storage,
        }),
      })

      if (!cloneRes.ok) {
        const err = await cloneRes.json()
        setPhase('error')
        setErrorMessage(err.error || 'Failed to start clone')
        return
      }

      const { upid, newid } = await cloneRes.json()

      intervalRef.current = setInterval(async () => {
        try {
          const taskRes = await fetch(
            `${apiUrl}/api/v1/vms/tasks/${encodeURIComponent(upid)}`,
            { headers: authHeaders }
          )

          if (!taskRes.ok) {
            cleanup()
            setPhase('error')
            setErrorMessage('Failed to check task status')
            return
          }

          const taskData = await taskRes.json()
          setProgress(taskData.percentage ?? 0)

          if (taskData.status === 'stopped') {
            cleanup()

            if (taskData.exitstatus !== 'OK') {
              setPhase('error')
              setErrorMessage(`Clone failed: ${taskData.exitstatus}`)
              return
            }

            setProgress(100)
            setPhase('configuring')

            let ipconfig0: string | undefined
            const subnet = data.subnet || '24'
            if (data.ip && data.gateway) {
              ipconfig0 = `ip=${data.ip}/${subnet},gw=${data.gateway}`
            } else if (data.ip) {
              ipconfig0 = `ip=${data.ip}/${subnet}`
            }

            const configRes = await fetch(`${apiUrl}/api/v1/vms/${newid}/config`, {
              method: 'PUT',
              headers: authHeaders,
              body: JSON.stringify({
                memory: data.memory,
                cores: data.cores,
                ciuser: data.ciuser || undefined,
                cipassword: data.cipassword || undefined,
                ipconfig0,
              }),
            })

            if (configRes.ok) {
              setPhase('done')
              toast.success('VM cloned and configured successfully.')
            } else {
              const err = await configRes.json()
              setPhase('error')
              setErrorMessage(err.error || 'Failed to configure VM')
            }
          }
        } catch {
          cleanup()
          setPhase('error')
          setErrorMessage('Failed to check task status')
        }
      }, 2000)
    } catch {
      setPhase('error')
      setErrorMessage('Failed to start clone')
    }
  }

  const handleClose = () => {
    cleanup()
    if (phase === 'done') {
      onSuccess()
    } else {
      onCancel()
    }
  }

  const isDismissable = phase === 'form' || phase === 'done' || phase === 'error'

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && isDismissable) handleClose() }}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
        onPointerDownOutside={(e) => { if (!isDismissable) e.preventDefault() }}
        onEscapeKeyDown={(e) => { if (!isDismissable) e.preventDefault() }}
      >
        {phase === 'form' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#202224]">
                Clone Virtual Machine
              </DialogTitle>
              <DialogDescription>
                Clone a VM from a template with custom configuration.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="template"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ubuntu">Ubuntu (11001)</SelectItem>
                          <SelectItem value="kali">Kali Linux (11002)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="my-vm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="storage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage</FormLabel>
                      <FormControl>
                        <Input placeholder="local-lvm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="memory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Memory (MB)</FormLabel>
                        <FormControl>
                          <Input type="number" min="512" step="128" placeholder="2048" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cores"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPU Cores</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="128" placeholder="2" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-[#202224] mb-3">Cloud-Init Configuration</p>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="ciuser"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>User</FormLabel>
                            <FormControl>
                              <Input placeholder="ubuntu" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cipassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="ip"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IP Address</FormLabel>
                            <FormControl>
                              <Input placeholder="10.0.0.100" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="subnet"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subnet</FormLabel>
                            <FormControl>
                              <Input placeholder="24" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="gateway"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gateway</FormLabel>
                            <FormControl>
                              <Input placeholder="10.0.0.1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="border-gray-200 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#4379EE] hover:bg-[#3568d4] text-white rounded-xl"
                  >
                    Clone VM
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}

        {phase === 'cloning' && (
          <div className="py-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#202224]">
                Cloning VM...
              </DialogTitle>
            </DialogHeader>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className="h-full bg-[#4379EE] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 text-center">{progress}% complete</p>
          </div>
        )}

        {phase === 'configuring' && (
          <div className="py-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#202224]">
                Configuring VM...
              </DialogTitle>
            </DialogHeader>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className="h-full bg-[#4379EE] rounded-full transition-all duration-500"
                style={{ width: '100%' }}
              />
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Applying configuration...
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div className="py-6 space-y-4 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#202224]">
                VM Cloned Successfully
              </DialogTitle>
              <DialogDescription>
                The virtual machine has been cloned and configured.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center">
              <Button
                onClick={handleClose}
                className="bg-[#4379EE] hover:bg-[#3568d4] text-white rounded-xl"
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        )}

        {phase === 'error' && (
          <div className="py-6 space-y-4 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto" />
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#202224]">
                Clone Failed
              </DialogTitle>
              <DialogDescription className="text-red-600">
                {errorMessage}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center">
              <Button
                onClick={handleClose}
                variant="outline"
                className="border-gray-200 rounded-xl"
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
