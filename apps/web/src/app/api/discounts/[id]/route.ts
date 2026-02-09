import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@repo/database'
import { authOptions } from '@/lib/auth'

// GET /api/discounts/:id - Get a single discount
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const discount = await prisma.eventDiscount.findUnique({
      where: { id: params.id },
    })

    if (!discount) {
      return NextResponse.json({ error: 'Discount not found' }, { status: 404 })
    }

    return NextResponse.json(discount)
  } catch (error) {
    console.error('Failed to fetch discount:', error)
    return NextResponse.json(
      { error: 'Failed to fetch discount' },
      { status: 500 }
    )
  }
}

// PUT /api/discounts/:id - Update a discount
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

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

    // Validate percentage range if provided
    if (percentage !== undefined && (percentage < 0 || percentage > 100)) {
      return NextResponse.json(
        { error: 'Percentage must be between 0 and 100' },
        { status: 400 }
      )
    }

    // Validate date range if both dates are provided
    if (startDate !== undefined && endDate !== undefined) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (end <= start) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        )
      }
    }

    const discount = await prisma.eventDiscount.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(percentage !== undefined && { percentage }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(active !== undefined && { active }),
      },
    })

    return NextResponse.json(discount)
  } catch (error) {
    console.error('Failed to update discount:', error)
    return NextResponse.json(
      { error: 'Failed to update discount' },
      { status: 500 }
    )
  }
}

// DELETE /api/discounts/:id - Delete a discount
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

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

    await prisma.eventDiscount.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete discount:', error)
    return NextResponse.json(
      { error: 'Failed to delete discount' },
      { status: 500 }
    )
  }
}
