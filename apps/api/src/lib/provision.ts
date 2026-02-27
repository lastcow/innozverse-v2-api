import crypto from 'node:crypto'
import { proxmoxFetch, getProxmoxNode } from './proxmox'

const API_URL = `http://localhost:${process.env.PORT || '3001'}`

interface ProxmoxTaskStatus {
  status: string
  exitstatus?: string
}

interface ProvisionParams {
  userId: string
  subscriptionId?: string
  cloneFrom: number
  cpuCores: number
  memory: number
  storage: number
  vmType: string
  accessToken: string
}

interface ProvisionResult {
  vmid: number
  ipAddress: string
  username: string
  password: string
}

function generateUsername(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars[crypto.randomInt(chars.length)]
  }
  return result
}

function generatePassword(): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const digits = '0123456789'
  const symbols = '!@#$%^&*'
  const all = upper + lower + digits + symbols

  // Ensure at least one of each category
  let result = ''
  result += upper[crypto.randomInt(upper.length)]
  result += lower[crypto.randomInt(lower.length)]
  result += digits[crypto.randomInt(digits.length)]
  result += symbols[crypto.randomInt(symbols.length)]

  for (let i = 4; i < 16; i++) {
    result += all[crypto.randomInt(all.length)]
  }

  // Shuffle
  const arr = result.split('')
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1)
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr.join('')
}

async function apiFetch<T = unknown>(
  path: string,
  accessToken: string,
  options?: { method?: string; body?: Record<string, unknown> }
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: options?.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error((errorData as { error?: string }).error || `API error ${response.status}`)
  }

  return response.json() as Promise<T>
}

async function pollTask(node: string, upid: string, timeoutMs: number): Promise<boolean> {
  const encodedUpid = encodeURIComponent(upid)
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    await sleep(3000)

    try {
      const status = await proxmoxFetch<ProxmoxTaskStatus>(
        `/nodes/${node}/tasks/${encodedUpid}/status`
      )

      if (status.status === 'stopped') {
        return status.exitstatus === 'OK'
      }
    } catch {
      // Transient error, keep polling
    }
  }

  console.error(`Task ${upid} timed out after ${timeoutMs}ms`)
  return false
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Provision a single VM using HTTP calls for all DB operations.
 *
 * 1. Allocate IP from pool
 * 2. Generate credentials
 * 3. Get next Proxmox VMID
 * 4. Update allocation with actual VMID
 * 5. Clone template
 * 6. Configure VM (cores, memory, IP, credentials)
 * 7. Resize disk
 * 8. Start VM
 * 9. Save VM record to DB
 */
export async function provisionVM(params: ProvisionParams): Promise<ProvisionResult> {
  const { userId, subscriptionId, cloneFrom, cpuCores, memory, storage, vmType, accessToken } = params
  const node = getProxmoxNode()

  let allocationId: string | null = null

  try {
    // 1. Allocate IP
    const ipResult = await apiFetch<{
      allocationId: string
      ipAddress: string
      cidr: number
      gateway: string
    }>('/api/v1/ip-pool/allocate', accessToken, { method: 'POST' })

    allocationId = ipResult.allocationId
    const { ipAddress, cidr, gateway } = ipResult

    console.log(`Allocated IP ${ipAddress}/${cidr} (allocation: ${allocationId})`)

    // 2. Generate credentials
    const username = generateUsername()
    const password = generatePassword()

    // 3. Get next Proxmox VMID
    const rawNextId = await proxmoxFetch<number | string>('/cluster/nextid')
    const newid = typeof rawNextId === 'string' ? parseInt(rawNextId, 10) : rawNextId

    console.log(`Got next VMID: ${newid}`)

    // 4. Update allocation with actual VMID
    await apiFetch(`/api/v1/ip-pool/allocations/${allocationId}`, accessToken, {
      method: 'PATCH',
      body: { vmid: newid },
    })

    // 5. Clone template
    const vmName = `vm-${newid}-${userId.slice(0, 8)}`

    // Pick storage — most available space from vmable pools
    const storageRes = await apiFetch<{ storages: Array<{ name: string; vmable: boolean; active: boolean; availBytes: string }> }>(
      '/api/v1/storage', accessToken
    )
    const vmableStorage = storageRes.storages
      .filter((s) => s.active && s.vmable)
      .sort((a, b) => Number(b.availBytes) - Number(a.availBytes))[0]

    if (!vmableStorage) {
      throw new Error('No vmable storage available')
    }

    const upid = await proxmoxFetch<string>(`/nodes/${node}/qemu/${cloneFrom}/clone`, {
      method: 'POST',
      contentType: 'form',
      body: { newid, name: vmName, full: 1, storage: vmableStorage.name },
    })

    console.log(`Cloning template ${cloneFrom} → VM ${newid}, task: ${upid}`)

    // Poll clone task (5 min timeout)
    const cloneSuccess = await pollTask(node, upid, 5 * 60 * 1000)
    if (!cloneSuccess) {
      throw new Error(`Clone task failed for VM ${vmName}`)
    }

    await sleep(2000)

    // 6. Configure VM
    await proxmoxFetch(`/nodes/${node}/qemu/${newid}/config`, {
      method: 'PUT',
      contentType: 'form',
      body: {
        cores: cpuCores,
        memory,
        ipconfig0: `ip=${ipAddress}/${cidr},gw=${gateway}`,
        ciuser: username,
        cipassword: password,
      },
    })

    console.log(`Configured VM ${newid}: ${cpuCores} cores, ${memory}MB RAM, IP ${ipAddress}`)

    // 7. Resize disk
    await proxmoxFetch(`/nodes/${node}/qemu/${newid}/resize`, {
      method: 'PUT',
      contentType: 'form',
      body: { disk: 'scsi0', size: `${storage}G` },
    })

    // 8. Start VM
    await proxmoxFetch(`/nodes/${node}/qemu/${newid}/status/start`, { method: 'POST' })

    // 9. Save to DB
    await apiFetch('/api/v1/vms', accessToken, {
      method: 'POST',
      body: {
        vmid: newid,
        name: vmName,
        type: vmType,
        node,
        status: 'running',
        memory,
        cpuCores,
        ipAddress,
        gateway,
        username,
        password,
        userId,
        subscriptionId: subscriptionId ?? null,
        storage: vmableStorage.name,
      },
    })

    console.log(`VM ${vmName} (vmid=${newid}) provisioned successfully`)

    return { vmid: newid, ipAddress, username, password }
  } catch (error) {
    // Cleanup: release IP allocation on failure
    if (allocationId) {
      try {
        await apiFetch(`/api/v1/ip-pool/allocations/${allocationId}`, accessToken, {
          method: 'DELETE',
        })
        console.log(`Released IP allocation ${allocationId} after provisioning failure`)
      } catch {
        console.error(`Failed to release IP allocation ${allocationId}`)
      }
    }

    throw error
  }
}
