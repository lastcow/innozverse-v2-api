import { Hono } from 'hono'
import { prisma } from '@repo/database'
import { authMiddleware, requireRole } from '../middleware/auth'
import { proxmoxFetch, getProxmoxNode } from '../lib/proxmox'
import type { AuthContext } from '../types'

const app = new Hono<{ Variables: AuthContext }>()

interface ProxmoxStorage {
  storage: string
  type: string
  content: string
  active: number
}

interface ProxmoxStorageStatus {
  total: number
  used: number
  avail: number
  type: string
}

// POST /api/v1/storage/sync - Sync storage pools from Proxmox
app.post('/api/v1/storage/sync', authMiddleware, requireRole(['ADMIN', 'SYSTEM']), async (c) => {
  try {
    const node = getProxmoxNode()

    // Get storage pools that support VM disk images
    const pools = await proxmoxFetch<ProxmoxStorage[]>(`/nodes/${node}/storage?content=images`)

    for (const pool of pools) {
      // Get detailed status for each pool
      let status: ProxmoxStorageStatus
      try {
        status = await proxmoxFetch<ProxmoxStorageStatus>(`/nodes/${node}/storage/${pool.storage}/status`)
      } catch {
        console.warn(`Failed to get status for storage ${pool.storage}, skipping`)
        continue
      }

      await prisma.storage.upsert({
        where: { name: pool.storage },
        update: {
          node,
          type: status.type || pool.type,
          totalBytes: BigInt(status.total || 0),
          usedBytes: BigInt(status.used || 0),
          availBytes: BigInt(status.avail || 0),
          active: pool.active === 1,
        },
        create: {
          name: pool.storage,
          node,
          type: status.type || pool.type,
          totalBytes: BigInt(status.total || 0),
          usedBytes: BigInt(status.used || 0),
          availBytes: BigInt(status.avail || 0),
          active: pool.active === 1,
          vmable: false,
        },
      })
    }

    // Fetch updated list
    const storages = await prisma.storage.findMany({ orderBy: { name: 'asc' } })

    return c.json({
      success: true,
      storages: storages.map(serializeStorage),
    })
  } catch (error) {
    console.error('Failed to sync storage:', error)
    const message = error instanceof Error ? error.message : 'Failed to sync storage'
    return c.json({ error: message }, 500)
  }
})

// GET /api/v1/storage - List all storage pools
app.get('/api/v1/storage', authMiddleware, requireRole(['ADMIN', 'SYSTEM']), async (c) => {
  try {
    const storages = await prisma.storage.findMany({ orderBy: { name: 'asc' } })
    return c.json({ storages: storages.map(serializeStorage) })
  } catch (error) {
    console.error('Failed to fetch storage:', error)
    return c.json({ error: 'Failed to fetch storage' }, 500)
  }
})

// PUT /api/v1/storage/:id - Update storage (toggle vmable, active)
app.put('/api/v1/storage/:id', authMiddleware, requireRole(['ADMIN', 'SYSTEM']), async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()

    const data: Record<string, unknown> = {}
    if ('vmable' in body) data.vmable = !!body.vmable
    if ('active' in body) data.active = !!body.active

    const storage = await prisma.storage.update({
      where: { id },
      data,
    })

    return c.json({ storage: serializeStorage(storage) })
  } catch (error) {
    console.error('Failed to update storage:', error)
    return c.json({ error: 'Failed to update storage' }, 500)
  }
})

function serializeStorage(s: {
  id: string
  name: string
  node: string
  type: string | null
  totalBytes: bigint
  usedBytes: bigint
  availBytes: bigint
  active: boolean
  vmable: boolean
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: s.id,
    name: s.name,
    node: s.node,
    type: s.type,
    totalBytes: s.totalBytes.toString(),
    usedBytes: s.usedBytes.toString(),
    availBytes: s.availBytes.toString(),
    active: s.active,
    vmable: s.vmable,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }
}

export default app
