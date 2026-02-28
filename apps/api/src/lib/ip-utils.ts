import { prisma } from '@repo/database'

export async function releaseIpAllocation(vmid: number): Promise<void> {
  const result = await prisma.ipAllocation.deleteMany({ where: { vmid } })
  if (result.count > 0) {
    console.log(`Released ${result.count} IP allocation(s) for vmid=${vmid}`)
  }
}
