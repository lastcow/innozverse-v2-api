import { prisma } from '@repo/database'
import { getActiveEventDiscount } from '@/lib/discount'
import { OpenClawContent } from './openclaw-content'

export default async function OpenClawPage() {
  const eventDiscounts = await prisma.eventDiscount.findMany({
    where: { active: true },
  })

  const serializedDiscounts = eventDiscounts.map((d) => ({
    ...d,
    percentage: Number(d.percentage),
  }))

  const activeEventDiscount = getActiveEventDiscount(serializedDiscounts)

  return (
    <OpenClawContent
      eventDiscount={
        activeEventDiscount
          ? {
              name: activeEventDiscount.name,
              percentage: activeEventDiscount.percentage,
            }
          : null
      }
    />
  )
}
