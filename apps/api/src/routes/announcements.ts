import { Hono } from 'hono'
import { prisma } from '@repo/database'
import { authMiddleware, requireRole } from '../middleware/auth'
import type { AuthContext } from '../types'

const app = new Hono<{ Variables: AuthContext }>()

// GET /api/v1/announcements/active - Public, no auth
app.get('/api/v1/announcements/active', async (c) => {
  try {
    const now = new Date()
    const announcements = await prisma.announcement.findMany({
      where: {
        active: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    })
    return c.json({ announcements })
  } catch (error) {
    console.error('Failed to fetch active announcements:', error)
    return c.json({ error: 'Failed to fetch announcements' }, 500)
  }
})

// GET /api/v1/announcements - Admin only, all announcements
app.get('/api/v1/announcements', authMiddleware, requireRole(['ADMIN', 'SYSTEM']), async (c) => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return c.json({ announcements })
  } catch (error) {
    console.error('Failed to fetch announcements:', error)
    return c.json({ error: 'Failed to fetch announcements' }, 500)
  }
})

// POST /api/v1/announcements - Admin only, create
app.post('/api/v1/announcements', authMiddleware, requireRole(['ADMIN', 'SYSTEM']), async (c) => {
  try {
    const body = await c.req.json()
    const { title, content, startDate, endDate, active } = body

    if (!title || !content || !startDate || !endDate) {
      return c.json({ error: 'title, content, startDate, and endDate are required' }, 400)
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        active: active ?? true,
      },
    })
    return c.json({ announcement }, 201)
  } catch (error) {
    console.error('Failed to create announcement:', error)
    return c.json({ error: 'Failed to create announcement' }, 500)
  }
})

// PUT /api/v1/announcements/:id - Admin only, update
app.put('/api/v1/announcements/:id', authMiddleware, requireRole(['ADMIN', 'SYSTEM']), async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const { title, content, startDate, endDate, active } = body

    const data: Record<string, unknown> = {}
    if (title !== undefined) data.title = title
    if (content !== undefined) data.content = content
    if (startDate !== undefined) data.startDate = new Date(startDate)
    if (endDate !== undefined) data.endDate = new Date(endDate)
    if (active !== undefined) data.active = active

    const announcement = await prisma.announcement.update({
      where: { id },
      data,
    })
    return c.json({ announcement })
  } catch (error) {
    console.error('Failed to update announcement:', error)
    return c.json({ error: 'Failed to update announcement' }, 500)
  }
})

// DELETE /api/v1/announcements/:id - Admin only, hard delete
app.delete('/api/v1/announcements/:id', authMiddleware, requireRole(['ADMIN', 'SYSTEM']), async (c) => {
  try {
    const id = c.req.param('id')
    await prisma.announcement.delete({ where: { id } })
    return c.json({ success: true })
  } catch (error) {
    console.error('Failed to delete announcement:', error)
    return c.json({ error: 'Failed to delete announcement' }, 500)
  }
})

export default app
