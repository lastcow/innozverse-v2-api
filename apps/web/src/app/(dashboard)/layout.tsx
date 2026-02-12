import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@repo/database'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/auth/login')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email! },
    select: { role: true },
  })

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <DashboardShell userRole={user.role as 'USER' | 'ADMIN' | 'SYSTEM'}>
      {children}
    </DashboardShell>
  )
}
