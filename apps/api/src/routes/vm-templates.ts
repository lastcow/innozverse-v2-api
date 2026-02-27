import { Hono } from 'hono'
import { prisma } from '@repo/database'
import { authMiddleware, requireRole } from '../middleware/auth'
import type { AuthContext } from '../types'

const app = new Hono<{ Variables: AuthContext }>()

// GET /api/v1/vm-templates - List templates (optionally filter by osType and active)
app.get('/api/v1/vm-templates', authMiddleware, requireRole(['ADMIN', 'SYSTEM']), async (c) => {
  try {
    const osType = c.req.query('osType')
    const activeParam = c.req.query('active')

    const where: Record<string, unknown> = {}
    if (osType) where.osType = osType
    if (activeParam !== undefined) where.active = activeParam === 'true'

    const templates = await prisma.vmTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return c.json({
      templates: templates.map((t) => ({
        id: t.id,
        vmid: t.vmid,
        osType: t.osType,
        name: t.name,
        active: t.active,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Failed to fetch VM templates:', error)
    return c.json({ error: 'Failed to fetch VM templates' }, 500)
  }
})

// POST /api/v1/vm-templates - Create a new template
app.post('/api/v1/vm-templates', authMiddleware, requireRole(['ADMIN', 'SYSTEM']), async (c) => {
  try {
    const body = await c.req.json()
    const { vmid, osType, name, active } = body

    if (!vmid || !osType || !name) {
      return c.json({ error: 'vmid, osType, and name are required' }, 400)
    }

    const template = await prisma.vmTemplate.create({
      data: {
        vmid: parseInt(String(vmid), 10),
        osType,
        name,
        active: active !== false,
      },
    })

    return c.json({
      template: {
        id: template.id,
        vmid: template.vmid,
        osType: template.osType,
        name: template.name,
        active: template.active,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
      },
    }, 201)
  } catch (error) {
    console.error('Failed to create VM template:', error)
    const message = error instanceof Error ? error.message : 'Failed to create VM template'
    return c.json({ error: message }, 500)
  }
})

// PUT /api/v1/vm-templates/:id - Update a template
app.put('/api/v1/vm-templates/:id', authMiddleware, requireRole(['ADMIN', 'SYSTEM']), async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()

    const data: Record<string, unknown> = {}
    if ('vmid' in body) data.vmid = parseInt(String(body.vmid), 10)
    if ('osType' in body) data.osType = body.osType
    if ('name' in body) data.name = body.name
    if ('active' in body) data.active = !!body.active

    const template = await prisma.vmTemplate.update({
      where: { id },
      data,
    })

    return c.json({
      template: {
        id: template.id,
        vmid: template.vmid,
        osType: template.osType,
        name: template.name,
        active: template.active,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Failed to update VM template:', error)
    const message = error instanceof Error ? error.message : 'Failed to update VM template'
    return c.json({ error: message }, 500)
  }
})

// DELETE /api/v1/vm-templates/:id - Delete a template
app.delete('/api/v1/vm-templates/:id', authMiddleware, requireRole(['ADMIN', 'SYSTEM']), async (c) => {
  try {
    const id = c.req.param('id')
    await prisma.vmTemplate.delete({ where: { id } })
    return c.json({ success: true })
  } catch (error) {
    console.error('Failed to delete VM template:', error)
    const message = error instanceof Error ? error.message : 'Failed to delete VM template'
    return c.json({ error: message }, 500)
  }
})

export default app
