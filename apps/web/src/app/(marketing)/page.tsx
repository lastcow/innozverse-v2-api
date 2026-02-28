import { Hero } from '@/components/home/hero'
import { HybridLearning } from '@/components/home/hybrid-learning'
import { StudentAdvantage } from '@/components/home/student-advantage'
import { CommunityTrust } from '@/components/home/community-trust'
import { prisma } from '@repo/database'

export default async function HomePage() {
  const [featuredProducts, eventDiscounts] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      orderBy: { soldCount: 'desc' },
      take: 3,
      select: {
        id: true,
        name: true,
        description: true,
        basePrice: true,
        imageUrls: true,
        studentDiscountPercentage: true,
        type: true,
        stock: true,
        properties: true,
      },
    }),
    prisma.eventDiscount.findMany({
      where: { active: true },
    }),
  ])

  const serialized = featuredProducts.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    basePrice: Number(p.basePrice),
    imageUrls: (p.imageUrls as string[]) || [],
    studentDiscountPercentage: p.studentDiscountPercentage
      ? Number(p.studentDiscountPercentage)
      : null,
    type: p.type as string,
    stock: p.stock,
    properties: p.properties as Record<string, string>,
  }))

  const serializedDiscounts = eventDiscounts.map((d) => ({
    ...d,
    percentage: Number(d.percentage),
  }))

  return (
    <>
      <Hero />
      <HybridLearning />
      <StudentAdvantage products={serialized} activeEventDiscounts={serializedDiscounts} />
      <CommunityTrust />
    </>
  )
}
