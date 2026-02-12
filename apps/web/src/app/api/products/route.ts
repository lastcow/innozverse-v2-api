import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@repo/database'
import { ProductType } from '@prisma/client'

// GET /api/products - List all products with optional type filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const typeParam = searchParams.get('type')
    const activeOnly = searchParams.get('activeOnly') !== 'false' // Default to true

    // Validate type parameter if provided
    const validTypes: ProductType[] = ['SURFACE', 'LAPTOP', 'XBOX']
    let typeFilter: ProductType | undefined

    if (typeParam) {
      if (!validTypes.includes(typeParam as ProductType)) {
        return NextResponse.json(
          { error: `Invalid product type. Must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        )
      }
      typeFilter = typeParam as ProductType
    }

    // Build where clause for products query
    const whereClause: {
      type?: ProductType
      active?: boolean
    } = {}

    if (typeFilter) {
      whereClause.type = typeFilter
    }

    if (activeOnly) {
      whereClause.active = true
    }

    // Fetch products and active event discounts in parallel
    const now = new Date()
    const [products, activeEventDiscounts] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
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

    return NextResponse.json({
      products,
      activeEventDiscounts,
    })
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST /api/products - Create a new product
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
    const { name, upc, description, type, basePrice, stock, properties, imageUrls, studentDiscountPercentage } = body

    // Validate required fields
    if (!name || !description || !type || basePrice === undefined || stock === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

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

    const product = await prisma.product.create({
      data: {
        name,
        upc: upc || 'N/A',
        description,
        type,
        basePrice,
        stock,
        properties: properties || {},
        imageUrls: imageUrls || [],
        studentDiscountPercentage: studentDiscountPercentage ?? null,
        active: true,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Failed to create product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
