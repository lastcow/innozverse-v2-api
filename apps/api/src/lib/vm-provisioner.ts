import { SignJWT } from 'jose'
import { prisma } from '@repo/database'
import { proxmoxFetch, getProxmoxNode } from './proxmox'
import { provisionVM } from './provision'

const API_URL = `http://localhost:${process.env.PORT || '3001'}`

interface VmSpec {
  template: 'ubuntu' | 'kali'
  cores: number
  memory: number
  diskSize?: number
}

/**
 * Generate a short-lived system JWT for internal API calls.
 * This allows provisionVM to call API endpoints without needing
 * a token from the caller (works from webhooks and admin routes).
 */
async function generateSystemToken(): Promise<string> {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET not configured')

  const key = new TextEncoder().encode(secret)
  return new SignJWT({ userId: 'system', email: 'system@internal', role: 'SYSTEM' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('10m')
    .sign(key)
}

/**
 * Resolve an OS type (e.g. "ubuntu") to a Proxmox template VMID
 * by querying the VM Templates API.
 * Falls back to hardcoded defaults if the API returns nothing.
 */
async function resolveTemplateVmid(osType: string, accessToken: string): Promise<number | null> {
  try {
    const response = await fetch(
      `${API_URL}/api/v1/vm-templates?osType=${encodeURIComponent(osType)}&active=true`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (response.ok) {
      const data = await response.json() as { templates: Array<{ vmid: number }> }
      if (data.templates.length > 0) {
        return data.templates[0]!.vmid
      }
    }
  } catch (error) {
    console.warn(`Failed to resolve template for osType=${osType} via API:`, error)
  }

  // Fallback to hardcoded defaults
  const fallback: Record<string, number> = { ubuntu: 11001, kali: 11002 }
  return fallback[osType] ?? null
}

/**
 * Provision VMs for a newly activated subscription.
 * Uses the new provisionVM utility which calls API endpoints for all DB ops.
 */
export async function provisionVmsForSubscription(
  userId: string,
  subscriptionId: string,
  planId: string
) {
  // Idempotency — skip if VMs already exist for this subscription
  const existing = await prisma.virtualMachine.count({
    where: { subscriptionId, deletedAt: null },
  })
  if (existing > 0) {
    console.log(`VMs already provisioned for subscription ${subscriptionId}, skipping`)
    return
  }

  // Load plan and read vmConfig
  const plan = await prisma.plan.findUnique({ where: { id: planId } })
  if (!plan) {
    console.error(`Plan ${planId} not found for provisioning`)
    return
  }

  const vmConfig = plan.vmConfig as unknown as VmSpec[]
  if (!Array.isArray(vmConfig) || vmConfig.length === 0) {
    console.log(`Plan ${plan.name} has no VM config, skipping provisioning`)
    return
  }

  // Generate system token for internal API calls
  const accessToken = await generateSystemToken()

  console.log(
    `Provisioning ${vmConfig.length} VMs for user ${userId}, plan "${plan.name}" (${planId}), ` +
    `vmConfig: ${JSON.stringify(vmConfig)}`
  )

  for (let i = 0; i < vmConfig.length; i++) {
    const spec = vmConfig[i]!

    try {
      // Resolve template VMID from DB (or fallback)
      const templateVmid = await resolveTemplateVmid(spec.template, accessToken)
      if (!templateVmid) {
        console.error(`Unknown template: ${spec.template}`)
        continue
      }

      // Derive display type from template name (e.g. "ubuntu" → "Ubuntu", "kali" → "Kali")
      const vmType = spec.template.charAt(0).toUpperCase() + spec.template.slice(1)

      // Call the new provisionVM utility
      const result = await provisionVM({
        userId,
        subscriptionId,
        cloneFrom: templateVmid,
        cpuCores: spec.cores,
        memory: spec.memory,
        storage: spec.diskSize ?? 32,
        vmType,
        accessToken,
      })

      console.log(
        `VM provisioned for subscription ${subscriptionId}: ` +
        `vmid=${result.vmid}, ip=${result.ipAddress}, user=${result.username}`
      )
    } catch (error) {
      console.error(`Failed to provision VM ${i + 1} (${spec.template}):`, error)
    }
  }
}

/**
 * Destroy all VMs linked to a subscription.
 * Stops running VMs, deletes from Proxmox, and soft-deletes in DB.
 */
export async function destroyVmsForSubscription(subscriptionId: string) {
  const vms = await prisma.virtualMachine.findMany({
    where: { subscriptionId, deletedAt: null },
  })

  if (vms.length === 0) return

  const node = getProxmoxNode()
  console.log(`Destroying ${vms.length} VMs for subscription ${subscriptionId}`)

  for (const vm of vms) {
    try {
      if (vm.status === 'running') {
        try {
          await proxmoxFetch(`/nodes/${node}/qemu/${vm.vmid}/status/stop`, { method: 'POST' })
          await sleep(3000)
        } catch {
          // May already be stopped
        }
      }

      try {
        await proxmoxFetch(`/nodes/${node}/qemu/${vm.vmid}`, { method: 'DELETE' })
      } catch (error) {
        console.warn(`Failed to delete VM ${vm.vmid} from Proxmox:`, error)
      }

      await prisma.virtualMachine.update({
        where: { id: vm.id },
        data: { deletedAt: new Date(), status: 'deleted' },
      })

      console.log(`VM ${vm.name} (vmid=${vm.vmid}) destroyed`)
    } catch (error) {
      console.error(`Failed to destroy VM ${vm.name}:`, error)
    }
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
