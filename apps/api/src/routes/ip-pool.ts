import { Hono } from 'hono'
import { prisma } from '@repo/database'
import { authMiddleware, requireRole } from '../middleware/auth'
import type { AuthContext } from '../types'

const app = new Hono<{ Variables: AuthContext }>()

function ipToNum(ip: string): number {
  return ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct), 0) >>> 0
}

function numToIp(num: number): string {
  return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join('.')
}

// GET /api/v1/ip-pool - List all IP pools with allocation counts
app.get('/api/v1/ip-pool', authMiddleware, requireRole(['ADMIN', 'SYSTEM']), async (c) => {
  try {
    const pools = await prisma.ipPool.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { allocations: true } } },
    })

    return c.json({
      pools: pools.map((p) => ({
        id: p.id,
        name: p.name,
        startIp: p.startIp,
        endIp: p.endIp,
        cidr: p.cidr,
        gateway: p.gateway,
        allocationCount: p._count.allocations,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Failed to fetch IP pools:', error)
    return c.json({ error: 'Failed to fetch IP pools' }, 500)
  }
})

// POST /api/v1/ip-pool - Create a new IP pool
app.post('/api/v1/ip-pool', authMiddleware, requireRole(['ADMIN', 'SYSTEM']), async (c) => {
  try {
    const body = await c.req.json()
    const { name, startIp, endIp, cidr, gateway } = body

    if (!name || !startIp || !endIp || !gateway) {
      return c.json({ error: 'name, startIp, endIp, and gateway are required' }, 400)
    }

    const pool = await prisma.ipPool.create({
      data: {
        name,
        startIp,
        endIp,
        cidr: cidr ?? 24,
        gateway,
      },
    })

    return c.json({
      pool: {
        id: pool.id,
        name: pool.name,
        startIp: pool.startIp,
        endIp: pool.endIp,
        cidr: pool.cidr,
        gateway: pool.gateway,
        allocationCount: 0,
        createdAt: pool.createdAt.toISOString(),
        updatedAt: pool.updatedAt.toISOString(),
      },
    }, 201)
  } catch (error) {
    console.error('Failed to create IP pool:', error)
    const message = error instanceof Error ? error.message : 'Failed to create IP pool'
    return c.json({ error: message }, 500)
  }
})

// PUT /api/v1/ip-pool/:id - Update pool
app.put('/api/v1/ip-pool/:id', authMiddleware, requireRole(['ADMIN', 'SYSTEM']), async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()

    const data: Record<string, unknown> = {}
    if ('name' in body) data.name = body.name
    if ('startIp' in body) data.startIp = body.startIp
    if ('endIp' in body) data.endIp = body.endIp
    if ('cidr' in body) data.cidr = parseInt(String(body.cidr), 10)
    if ('gateway' in body) data.gateway = body.gateway

    const pool = await prisma.ipPool.update({
      where: { id },
      data,
      include: { _count: { select: { allocations: true } } },
    })

    return c.json({
      pool: {
        id: pool.id,
        name: pool.name,
        startIp: pool.startIp,
        endIp: pool.endIp,
        cidr: pool.cidr,
        gateway: pool.gateway,
        allocationCount: pool._count.allocations,
        createdAt: pool.createdAt.toISOString(),
        updatedAt: pool.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Failed to update IP pool:', error)
    const message = error instanceof Error ? error.message : 'Failed to update IP pool'
    return c.json({ error: message }, 500)
  }
})

// DELETE /api/v1/ip-pool/:id - Delete pool (cascade deletes allocations)
app.delete('/api/v1/ip-pool/:id', authMiddleware, requireRole(['ADMIN', 'SYSTEM']), async (c) => {
  try {
    const id = c.req.param('id')
    await prisma.ipPool.delete({ where: { id } })
    return c.json({ success: true })
  } catch (error) {
    console.error('Failed to delete IP pool:', error)
    const message = error instanceof Error ? error.message : 'Failed to delete IP pool'
    return c.json({ error: message }, 500)
  }
})

// GET /api/v1/ip-pool/:id/allocations - List allocations for a specific pool
app.get('/api/v1/ip-pool/:id/allocations', authMiddleware, requireRole(['ADMIN', 'SYSTEM']), async (c) => {
  try {
    const poolId = c.req.param('id')

    const allocations = await prisma.ipAllocation.findMany({
      where: { poolId },
      orderBy: { createdAt: 'desc' },
    })

    return c.json({
      allocations: allocations.map((a) => ({
        id: a.id,
        ipAddress: a.ipAddress,
        vmid: a.vmid,
        poolId: a.poolId,
        createdAt: a.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Failed to fetch allocations:', error)
    return c.json({ error: 'Failed to fetch allocations' }, 500)
  }
})

// DELETE /api/v1/ip-pool/allocations/:id - Release/delete a single allocation
app.delete('/api/v1/ip-pool/allocations/:id', authMiddleware, requireRole(['ADMIN', 'SYSTEM']), async (c) => {
  try {
    const id = c.req.param('id')
    await prisma.ipAllocation.delete({ where: { id } })
    return c.json({ success: true })
  } catch (error) {
    console.error('Failed to release allocation:', error)
    const message = error instanceof Error ? error.message : 'Failed to release allocation'
    return c.json({ error: message }, 500)
  }
})

// POST /api/v1/ip-pool/allocate - Find next free IP and create allocation
app.post('/api/v1/ip-pool/allocate', authMiddleware, requireRole(['ADMIN', 'SYSTEM']), async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}))
    const { poolId } = body as { poolId?: string }

    // Load target pool
    const pool = poolId
      ? await prisma.ipPool.findUnique({ where: { id: poolId } })
      : await prisma.ipPool.findFirst({ orderBy: { createdAt: 'asc' } })

    if (!pool) {
      return c.json({ error: 'No IP pool available' }, 404)
    }

    // Load existing allocations for this pool
    const existing = await prisma.ipAllocation.findMany({
      where: { poolId: pool.id },
      select: { ipAddress: true },
    })
    const usedIps = new Set(existing.map((a) => a.ipAddress))

    const startNum = ipToNum(pool.startIp)
    const endNum = ipToNum(pool.endIp)

    // Find first unused IP
    let allocatedIp: string | null = null
    for (let num = startNum; num <= endNum; num++) {
      const ip = numToIp(num)
      if (!usedIps.has(ip)) {
        allocatedIp = ip
        break
      }
    }

    if (!allocatedIp) {
      return c.json({ error: 'No IPs available in pool' }, 409)
    }

    // Create allocation with temporary vmid (-1 = pending)
    const allocation = await prisma.ipAllocation.create({
      data: {
        ipAddress: allocatedIp,
        poolId: pool.id,
        vmid: -1,
      },
    })

    return c.json({
      allocationId: allocation.id,
      ipAddress: allocatedIp,
      cidr: pool.cidr,
      gateway: pool.gateway,
    }, 201)
  } catch (error) {
    console.error('Failed to allocate IP:', error)
    const message = error instanceof Error ? error.message : 'Failed to allocate IP'
    return c.json({ error: message }, 500)
  }
})

// PATCH /api/v1/ip-pool/allocations/:id - Update allocation with actual vmid
app.patch('/api/v1/ip-pool/allocations/:id', authMiddleware, requireRole(['ADMIN', 'SYSTEM']), async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const { vmid } = body

    if (vmid === undefined) {
      return c.json({ error: 'vmid is required' }, 400)
    }

    const allocation = await prisma.ipAllocation.update({
      where: { id },
      data: { vmid: parseInt(String(vmid), 10) },
    })

    return c.json({
      allocation: {
        id: allocation.id,
        ipAddress: allocation.ipAddress,
        vmid: allocation.vmid,
        poolId: allocation.poolId,
        createdAt: allocation.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Failed to update allocation:', error)
    const message = error instanceof Error ? error.message : 'Failed to update allocation'
    return c.json({ error: message }, 500)
  }
})

export default app
