'use server'

import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface UserVM {
  id: string
  vmid: number
  name: string
  type: string | null
  node: string
  status: string
  memory: number
  cpuCores: number
  ipAddress: string | null
  publicIpAddress: string | null
  port: number | null
  gateway: string | null
  username: string | null
  password: string | null
  createdAt: string
}

export async function getUserVMs(): Promise<UserVM[]> {
  const session = await auth()
  if (!session?.accessToken) return []

  try {
    const res = await fetch(`${apiUrl}/api/v1/vms/me`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.vms ?? []
  } catch (error) {
    console.error('Failed to fetch user VMs:', error)
    return []
  }
}

export async function toggleUserVMStatus(
  vmid: number,
  action: 'start' | 'stop'
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.accessToken) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const res = await fetch(`${apiUrl}/api/v1/vms/me/${vmid}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({ action }),
    })

    if (!res.ok) {
      const data = await res.json()
      return { success: false, error: data.error || 'Failed to change VM status' }
    }

    revalidatePath('/user/vms')
    return { success: true }
  } catch (error) {
    console.error('Failed to toggle VM status:', error)
    return { success: false, error: 'Failed to change VM status' }
  }
}
