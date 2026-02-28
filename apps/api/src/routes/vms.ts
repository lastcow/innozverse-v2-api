import { Hono } from 'hono'
import { prisma } from '@repo/database'
import { authMiddleware, requireRole } from '../middleware/auth'
import { proxmoxFetch, getProxmoxNode } from '../lib/proxmox'
import { releaseIpAllocation } from '../lib/ip-utils'
import type { AuthContext } from '../types'

const app = new Hono<{ Variables: AuthContext }>()

const VM_TEMPLATE_IDS = [11001, 11002]

interface ProxmoxVM {
  vmid: number
  name?: string
  status: string
  maxmem: number
  cpus: number
}

interface ProxmoxVMConfig {
  memory?: string
  cores?: string
  ipconfig0?: string
  ciuser?: string
  cipassword?: string
}

interface ProxmoxTaskStatus {
  status: string
  exitstatus?: string
}

interface ProxmoxLogEntry {
  t?: string
}

function parseIpConfig(ipconfig0?: string) {
  if (!ipconfig0) return {} as { ip?: string; gateway?: string }
  let ip: string | undefined
  let gateway: string | undefined
  const ipMatch = ipconfig0.match(/ip=([^/,\s]+)/)
  if (ipMatch) ip = ipMatch[1]
  const gwMatch = ipconfig0.match(/gw=([^,\s]+)/)
  if (gwMatch) gateway = gwMatch[1]
  return { ip, gateway }
}

// ============================================================
// User-scoped endpoints (any authenticated user)
// ============================================================

// GET /api/v1/vms/me - List VMs assigned to the current user
app.get('/api/v1/vms/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const vms = await prisma.virtualMachine.findMany({
      where: { userId: user.userId, deletedAt: null },
      orderBy: { vmid: 'asc' },
    })

    return c.json({
      vms: vms.map((vm) => ({
        id: vm.id,
        vmid: vm.vmid,
        name: vm.name,
        type: vm.type,
        node: vm.node,
        status: vm.status,
        memory: vm.memory,
        cpuCores: vm.cpuCores,
        ipAddress: vm.ipAddress,
        publicIpAddress: vm.publicIpAddress,
        port: vm.port,
        gateway: vm.gateway,
        username: vm.username,
        password: vm.password,
        createdAt: vm.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Failed to fetch user VMs:', error)
    return c.json({ error: 'Failed to fetch VMs' }, 500)
  }
})

// POST /api/v1/vms/me/:vmid/status - Start or stop a VM owned by the current user
app.post('/api/v1/vms/me/:vmid/status', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const vmid = parseInt(c.req.param('vmid'), 10)
    const { action } = await c.req.json()

    if (action !== 'start' && action !== 'stop') {
      return c.json({ error: 'action must be "start" or "stop"' }, 400)
    }

    // Ownership check
    const vm = await prisma.virtualMachine.findFirst({
      where: { vmid, userId: user.userId, deletedAt: null },
    })
    if (!vm) {
      return c.json({ error: 'VM not found or not assigned to you' }, 404)
    }

    const node = getProxmoxNode()
    await proxmoxFetch(`/nodes/${node}/qemu/${vmid}/status/${action}`, { method: 'POST' })

    // Update status in DB
    await prisma.virtualMachine.update({
      where: { id: vm.id },
      data: { status: action === 'start' ? 'running' : 'stopped' },
    })

    return c.json({ success: true })
  } catch (error) {
    console.error('Failed to change VM status:', error)
    const message = error instanceof Error ? error.message : 'Failed to change VM status'
    return c.json({ error: message }, 500)
  }
})

// ============================================================
// Admin endpoints
// ============================================================

// POST /api/v1/vms - Create a VirtualMachine record in DB (used by provisionVM)
app.post('/api/v1/vms', authMiddleware, requireRole(['ADMIN', 'SYSTEM']), async (c) => {
  try {
    const body = await c.req.json()
    const { vmid, name, type, node, status, memory, cpuCores, ipAddress, gateway, username, password, userId, subscriptionId, storage } = body

    if (!vmid || !name) {
      return c.json({ error: 'vmid and name are required' }, 400)
    }

    const vm = await prisma.virtualMachine.upsert({
      where: { vmid: parseInt(String(vmid), 10) },
      update: {
        name,
        type: type ?? null,
        node: node ?? 'pve',
        status: status ?? 'stopped',
        memory: memory ? parseInt(String(memory), 10) : 2048,
        cpuCores: cpuCores ? parseInt(String(cpuCores), 10) : 2,
        ipAddress: ipAddress ?? null,
        gateway: gateway ?? null,
        username: username ?? null,
        password: password ?? null,
        userId: userId ?? null,
        subscriptionId: subscriptionId ?? null,
        storage: storage ?? null,
        deletedAt: null,
      },
      create: {
        vmid: parseInt(String(vmid), 10),
        name,
        type: type ?? null,
        node: node ?? 'pve',
        status: status ?? 'stopped',
        memory: memory ? parseInt(String(memory), 10) : 2048,
        cpuCores: cpuCores ? parseInt(String(cpuCores), 10) : 2,
        ipAddress: ipAddress ?? null,
        gateway: gateway ?? null,
        username: username ?? null,
        password: password ?? null,
        userId: userId ?? null,
        subscriptionId: subscriptionId ?? null,
        storage: storage ?? null,
      },
    })

    return c.json({
      vm: {
        id: vm.id,
        vmid: vm.vmid,
        name: vm.name,
        status: vm.status,
        createdAt: vm.createdAt.toISOString(),
      },
    }, 201)
  } catch (error) {
    console.error('Failed to create VM record:', error)
    const message = error instanceof Error ? error.message : 'Failed to create VM record'
    return c.json({ error: message }, 500)
  }
})

// POST /api/v1/vms/sync - Sync VMs from Proxmox into local DB
app.post('/api/v1/vms/sync', authMiddleware, requireRole(['ADMIN', 'SYSTEM']), async (c) => {
  try {
    const node = getProxmoxNode()
    const proxmoxVMs = await proxmoxFetch<ProxmoxVM[]>(`/nodes/${node}/qemu`)
    const activeVMs = proxmoxVMs.filter((vm) => !VM_TEMPLATE_IDS.includes(vm.vmid))

    // Fetch config for each VM in parallel
    const configResults = await Promise.allSettled(
      activeVMs.map((vm) =>
        proxmoxFetch<ProxmoxVMConfig>(`/nodes/${node}/qemu/${vm.vmid}/config`)
          .then((config) => ({ vmid: vm.vmid, config }))
      )
    )

    const configMap = new Map<number, ProxmoxVMConfig>()
    for (const result of configResults) {
      if (result.status === 'fulfilled') {
        configMap.set(result.value.vmid, result.value.config)
      }
    }

    // Get VMs currently being provisioned — skip overwriting their config
    const provisioningStatuses = ['provisioning', 'cloning', 'configuring', 'starting']
    const provisioningVmIds = new Set(
      (await prisma.virtualMachine.findMany({
        where: { status: { in: provisioningStatuses }, deletedAt: null },
        select: { vmid: true },
      })).map((v) => v.vmid)
    )

    // Upsert each VM
    const proxmoxVmIds = new Set<number>()
    for (const vm of activeVMs) {
      proxmoxVmIds.add(vm.vmid)

      // Skip VMs mid-provisioning — their Proxmox state is transient
      if (provisioningVmIds.has(vm.vmid)) continue

      const config = configMap.get(vm.vmid)
      const { ip, gateway } = parseIpConfig(config?.ipconfig0)
      const memory = parseInt(String(config?.memory ?? Math.round(vm.maxmem / (1024 * 1024))), 10) || 2048
      const cpuCores = parseInt(String(config?.cores ?? vm.cpus), 10) || 2

      // Don't overwrite username/password on update — Proxmox returns '***' for cipassword
      await prisma.virtualMachine.upsert({
        where: { vmid: vm.vmid },
        update: {
          name: vm.name || `VM ${vm.vmid}`,
          node,
          status: vm.status,
          memory,
          cpuCores,
          ipAddress: ip ?? null,
          gateway: gateway ?? null,
          deletedAt: null,
        },
        create: {
          vmid: vm.vmid,
          name: vm.name || `VM ${vm.vmid}`,
          node,
          status: vm.status,
          memory,
          cpuCores,
          ipAddress: ip ?? null,
          gateway: gateway ?? null,
          username: config?.ciuser ?? null,
          password: config?.cipassword ?? null,
        },
      })
    }

    // Soft-delete VMs no longer in Proxmox
    const dbVMs = await prisma.virtualMachine.findMany({
      where: { deletedAt: null },
      select: { vmid: true },
    })

    const missingVmIds = dbVMs
      .filter((dbVm) => !proxmoxVmIds.has(dbVm.vmid))
      .map((dbVm) => dbVm.vmid)

    if (missingVmIds.length > 0) {
      await prisma.virtualMachine.updateMany({
        where: { vmid: { in: missingVmIds } },
        data: { deletedAt: new Date(), status: 'deleted' },
      })
    }

    return c.json({ success: true })
  } catch (error) {
    console.error('Failed to sync VMs:', error)
    const message = error instanceof Error ? error.message : 'Failed to sync VMs'
    return c.json({ error: message }, 500)
  }
})

// GET /api/v1/vms - List active VMs from local DB
app.get('/api/v1/vms', authMiddleware, requireRole(['ADMIN', 'SYSTEM']), async (c) => {
  try {
    const vms = await prisma.virtualMachine.findMany({
      where: { deletedAt: null },
      orderBy: { vmid: 'asc' },
      include: {
        user: { select: { id: true, email: true, fname: true, lname: true } },
        subscription: { include: { plan: { select: { name: true } } } },
      },
    })

    return c.json({
      vms: vms.map((vm) => ({
        id: vm.id,
        vmid: vm.vmid,
        name: vm.name,
        type: vm.type,
        node: vm.node,
        status: vm.status,
        memory: vm.memory,
        cpuCores: vm.cpuCores,
        ipAddress: vm.ipAddress,
        publicIpAddress: vm.publicIpAddress,
        port: vm.port,
        gateway: vm.gateway,
        username: vm.username,
        password: vm.password,
        userId: vm.userId,
        subscriptionId: vm.subscriptionId,
        storage: vm.storage,
        assignedUser: vm.user
          ? {
              id: vm.user.id,
              email: vm.user.email,
              name: [vm.user.fname, vm.user.lname].filter(Boolean).join(' ') || vm.user.email,
            }
          : null,
        subscription: vm.subscription
          ? {
              planName: vm.subscription.plan.name,
              status: vm.subscription.status,
              billingPeriod: vm.subscription.billingPeriod,
            }
          : null,
        createdAt: vm.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Failed to fetch VMs:', error)
    return c.json({ error: 'Failed to fetch VMs' }, 500)
  }
})

// POST /api/v1/vms/clone - Clone a VM from template
app.post('/api/v1/vms/clone', authMiddleware, requireRole(['ADMIN', 'SYSTEM']), async (c) => {
  try {
    const body = await c.req.json()
    const { name, template, storage } = body

    if (!name || !template || !storage) {
      return c.json({ error: 'name, template, and storage are required' }, 400)
    }

    const templateId = template === 'ubuntu' ? 11001 : 11002
    const node = getProxmoxNode()

    // Get next VM ID
    const allVMs = await proxmoxFetch<ProxmoxVM[]>(`/nodes/${node}/qemu`)
    const existingIds = allVMs.map((vm) => vm.vmid).filter((id) => !VM_TEMPLATE_IDS.includes(id))
    const newid = existingIds.length === 0 ? 200 : Math.max(...existingIds) + 1

    const upid = await proxmoxFetch<string>(`/nodes/${node}/qemu/${templateId}/clone`, {
      method: 'POST',
      contentType: 'form',
      body: { newid, name, full: 1, storage },
    })

    // Store VM type in DB
    const vmType = template === 'ubuntu' ? 'Ubuntu' : 'Kali'
    await prisma.virtualMachine.upsert({
      where: { vmid: newid },
      update: { name, type: vmType, node, status: 'stopped', deletedAt: null },
      create: { vmid: newid, name, type: vmType, node, status: 'stopped' },
    })

    return c.json({ upid, newid })
  } catch (error) {
    console.error('Failed to clone VM:', error)
    const message = error instanceof Error ? error.message : 'Failed to clone VM'
    return c.json({ error: message }, 500)
  }
})

// GET /api/v1/vms/tasks/:upid - Get clone task status
app.get('/api/v1/vms/tasks/:upid', authMiddleware, requireRole(['ADMIN', 'SYSTEM']), async (c) => {
  try {
    const upid = c.req.param('upid')
    const node = getProxmoxNode()
    const encodedUpid = encodeURIComponent(upid)

    const status = await proxmoxFetch<ProxmoxTaskStatus>(`/nodes/${node}/tasks/${encodedUpid}/status`)
    const log = await proxmoxFetch<ProxmoxLogEntry[]>(`/nodes/${node}/tasks/${encodedUpid}/log`)

    let percentage = 0
    if (log && Array.isArray(log)) {
      for (const line of log) {
        const match = line.t?.match(/(\d+(?:\.\d+)?)%/)
        if (match) {
          percentage = Math.round(parseFloat(match[1]!))
        }
      }
    }

    return c.json({ status: status.status, exitstatus: status.exitstatus, percentage })
  } catch (error) {
    console.error('Failed to get task status:', error)
    const message = error instanceof Error ? error.message : 'Failed to get task status'
    return c.json({ error: message }, 500)
  }
})

// PATCH /api/v1/vms/:vmid - Update VM status (used by provisioner to track progress)
app.patch('/api/v1/vms/:vmid', authMiddleware, requireRole(['ADMIN', 'SYSTEM']), async (c) => {
  try {
    const vmid = parseInt(c.req.param('vmid'), 10)
    const { status } = await c.req.json()

    if (!status) {
      return c.json({ error: 'status is required' }, 400)
    }

    const vm = await prisma.virtualMachine.findFirst({
      where: { vmid, deletedAt: null },
    })
    if (!vm) {
      return c.json({ error: 'VM not found' }, 404)
    }

    await prisma.virtualMachine.update({
      where: { id: vm.id },
      data: { status },
    })

    return c.json({ success: true })
  } catch (error) {
    console.error('Failed to update VM status:', error)
    const message = error instanceof Error ? error.message : 'Failed to update VM status'
    return c.json({ error: message }, 500)
  }
})

// PUT /api/v1/vms/:vmid/config - Configure a VM (cloud-init, resources)
app.put('/api/v1/vms/:vmid/config', authMiddleware, requireRole(['ADMIN', 'SYSTEM']), async (c) => {
  try {
    const vmid = parseInt(c.req.param('vmid'), 10)
    const body = await c.req.json()
    const node = getProxmoxNode()

    const configBody: Record<string, unknown> = {}
    if (body.memory) configBody.memory = body.memory
    if (body.cores) configBody.cores = body.cores
    if (body.ciuser) configBody.ciuser = body.ciuser
    if (body.cipassword) configBody.cipassword = body.cipassword
    if (body.ipconfig0) configBody.ipconfig0 = body.ipconfig0

    await proxmoxFetch(`/nodes/${node}/qemu/${vmid}/config`, {
      method: 'PUT',
      contentType: 'form',
      body: configBody,
    })

    return c.json({ success: true })
  } catch (error) {
    console.error('Failed to configure VM:', error)
    const message = error instanceof Error ? error.message : 'Failed to configure VM'
    return c.json({ error: message }, 500)
  }
})

// POST /api/v1/vms/:vmid/status - Start or stop a VM
app.post('/api/v1/vms/:vmid/status', authMiddleware, requireRole(['ADMIN', 'SYSTEM']), async (c) => {
  try {
    const vmid = parseInt(c.req.param('vmid'), 10)
    const { action } = await c.req.json()

    if (action !== 'start' && action !== 'stop') {
      return c.json({ error: 'action must be "start" or "stop"' }, 400)
    }

    const node = getProxmoxNode()
    await proxmoxFetch(`/nodes/${node}/qemu/${vmid}/status/${action}`, { method: 'POST' })

    return c.json({ success: true })
  } catch (error) {
    console.error('Failed to change VM status:', error)
    const message = error instanceof Error ? error.message : 'Failed to change VM status'
    return c.json({ error: message }, 500)
  }
})

// PUT /api/v1/vms/:vmid/assign - Assign VM to user and set connection details
app.put('/api/v1/vms/:vmid/assign', authMiddleware, requireRole(['ADMIN', 'SYSTEM']), async (c) => {
  try {
    const vmid = parseInt(c.req.param('vmid'), 10)
    const body = await c.req.json()

    const vm = await prisma.virtualMachine.findFirst({
      where: { vmid, deletedAt: null },
    })
    if (!vm) {
      return c.json({ error: 'VM not found' }, 404)
    }

    const data: Record<string, unknown> = {}

    // User assignment (userId can be null to unassign)
    if ('userId' in body) {
      if (body.userId) {
        const user = await prisma.user.findUnique({ where: { id: body.userId } })
        if (!user) {
          return c.json({ error: 'User not found' }, 404)
        }
      }
      data.userId = body.userId || null
    }

    // Connection details
    if ('publicIpAddress' in body) {
      data.publicIpAddress = body.publicIpAddress || null
    }
    if ('port' in body) {
      data.port = body.port != null ? parseInt(String(body.port), 10) : null
    }

    await prisma.virtualMachine.update({
      where: { id: vm.id },
      data,
    })

    return c.json({ success: true })
  } catch (error) {
    console.error('Failed to update VM assignment:', error)
    const message = error instanceof Error ? error.message : 'Failed to update VM'
    return c.json({ error: message }, 500)
  }
})

// DELETE /api/v1/vms/:vmid - Delete a VM (Proxmox + soft-delete in DB)
app.delete('/api/v1/vms/:vmid', authMiddleware, requireRole(['ADMIN', 'SYSTEM']), async (c) => {
  try {
    const vmid = parseInt(c.req.param('vmid'), 10)
    const node = getProxmoxNode()

    // Check if running
    const allVMs = await proxmoxFetch<ProxmoxVM[]>(`/nodes/${node}/qemu`)
    const vm = allVMs.find((v) => v.vmid === vmid)
    if (vm && vm.status === 'running') {
      return c.json({ error: 'Cannot delete a running VM. Stop it first.' }, 400)
    }

    await proxmoxFetch(`/nodes/${node}/qemu/${vmid}`, { method: 'DELETE' })

    // Soft-delete in DB
    await prisma.virtualMachine.updateMany({
      where: { vmid },
      data: { deletedAt: new Date(), status: 'deleted' },
    })

    // Release IP allocation
    await releaseIpAllocation(vmid)

    return c.json({ success: true })
  } catch (error) {
    console.error('Failed to delete VM:', error)
    const message = error instanceof Error ? error.message : 'Failed to delete VM'
    return c.json({ error: message }, 500)
  }
})

export default app
