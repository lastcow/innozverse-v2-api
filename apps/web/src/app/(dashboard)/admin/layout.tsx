import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@repo/database'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  // Check if user has admin or system role
  const user = await prisma.user.findUnique({
    where: { email: session.user?.email! },
  })

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SYSTEM')) {
    redirect('/')
  }

  return <>{children}</>
}
