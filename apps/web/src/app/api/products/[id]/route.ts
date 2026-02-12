import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@repo/database'

// GET /api/products/:id - Get a single product with active event discounts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Fetch product and active event discounts in parallel
    const now = new Date()
    const [product, activeEventDiscounts] = await Promise.all([
      prisma.product.findUnique({
        where: { id: params.id },
      }),
      prisma.eventDiscount.findMany({
        where: {
          active: true,
          startDate: { lte: now },
          endDate: { gte: now },
        },
        orderBy: {
          percentage: 'desc',
        },
      }),
    ])

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({
      product,
      activeEventDiscounts,
    })
  } catch (error) {
    console.error('Failed to fetch product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// PUT /api/products/:id - Update a product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { name, upc, description, type, basePrice, stock, properties, imageUrls, active, studentDiscountPercentage } = body

    // Validate studentDiscountPercentage if provided
    if (studentDiscountPercentage !== undefined && studentDiscountPercentage !== null) {
      const discountValue = Number(studentDiscountPercentage)
      if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
        return NextResponse.json(
          { error: 'Student discount percentage must be between 0 and 100' },
          { status: 400 }
        )
      }
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(upc !== undefined && { upc }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(basePrice !== undefined && { basePrice }),
        ...(stock !== undefined && { stock }),
        ...(properties !== undefined && { properties }),
        ...(imageUrls !== undefined && { imageUrls }),
        ...(active !== undefined && { active }),
        ...(studentDiscountPercentage !== undefined && { studentDiscountPercentage: studentDiscountPercentage ?? null }),
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Failed to update product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/:id - Delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    await prisma.product.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
