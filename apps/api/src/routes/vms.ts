import { Hono } from 'hono'
import { prisma } from '@repo/database'
import { authMiddleware, requireRole } from '../middleware/auth'
import { proxmoxFetch, getProxmoxNode } from '../lib/proxmox'

const app = new Hono()

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

    // Upsert each VM
    const proxmoxVmIds = new Set<number>()
    for (const vm of activeVMs) {
      proxmoxVmIds.add(vm.vmid)
      const config = configMap.get(vm.vmid)
      const { ip, gateway } = parseIpConfig(config?.ipconfig0)
      const memory = parseInt(String(config?.memory ?? Math.round(vm.maxmem / (1024 * 1024))), 10) || 2048
      const cpuCores = parseInt(String(config?.cores ?? vm.cpus), 10) || 2

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
          username: config?.ciuser ?? null,
          password: config?.cipassword ?? null,
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
    })

    return c.json({
      vms: vms.map((vm) => ({
        id: vm.id,
        vmid: vm.vmid,
        name: vm.name,
        node: vm.node,
        status: vm.status,
        memory: vm.memory,
        cpuCores: vm.cpuCores,
        ipAddress: vm.ipAddress,
        gateway: vm.gateway,
        username: vm.username,
        password: vm.password,
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

    return c.json({ success: true })
  } catch (error) {
    console.error('Failed to delete VM:', error)
    const message = error instanceof Error ? error.message : 'Failed to delete VM'
    return c.json({ error: message }, 500)
  }
})

export default app
