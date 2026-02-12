import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@repo/database'

// GET /api/discounts - List all discounts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const now = new Date()

    const discounts = await prisma.eventDiscount.findMany({
      where: activeOnly
        ? {
            active: true,
            startDate: { lte: now },
            endDate: { gte: now },
          }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(discounts)
  } catch (error) {
    console.error('Failed to fetch discounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch discounts' },
      { status: 500 }
    )
  }
}

// POST /api/discounts - Create a new discount
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Check authentication and admin role
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SYSTEM')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, percentage, startDate, endDate, active } = body

    // Validate required fields
    if (!name || percentage === undefined || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate date range
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (end <= start) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Validate percentage range
    if (percentage < 0 || percentage > 100) {
      return NextResponse.json(
        { error: 'Percentage must be between 0 and 100' },
        { status: 400 }
      )
    }

    const discount = await prisma.eventDiscount.create({
      data: {
        name,
        description: description || null,
        percentage,
        startDate: start,
        endDate: end,
        active: active !== undefined ? active : true,
      },
    })

    return NextResponse.json(discount, { status: 201 })
  } catch (error) {
    console.error('Failed to create discount:', error)
    return NextResponse.json(
      { error: 'Failed to create discount' },
      { status: 500 }
    )
  }
}
