import https from 'node:https'

function getConfig() {
  const host = process.env.PROXMOX_HOST
  const tokenId = process.env.PROXMOX_TOKEN_ID
  const tokenSecret = process.env.PROXMOX_TOKEN_SECRET

  if (!host || !tokenId || !tokenSecret) {
    throw new Error('Proxmox environment variables not configured')
  }

  return { host, tokenId, tokenSecret }
}

export function getProxmoxNode() {
  return process.env.PROXMOX_NODE || 'pve'
}

export async function proxmoxFetch<T = unknown>(
  path: string,
  options?: { method?: string; body?: Record<string, unknown>; contentType?: 'json' | 'form' }
): Promise<T> {
  const { host, tokenId, tokenSecret } = getConfig()
  const url = `${host}/api2/json${path}`
  const method = options?.method || 'GET'
  const contentType = options?.contentType || 'json'

  let bodyStr: string | undefined
  let contentTypeHeader: string | undefined
  if (options?.body) {
    if (contentType === 'form') {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(options.body)) {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      }
      bodyStr = params.toString()
      contentTypeHeader = 'application/x-www-form-urlencoded'
    } else {
      bodyStr = JSON.stringify(options.body)
      contentTypeHeader = 'application/json'
    }
  }

  const parsed = new URL(url)

  return new Promise<T>((resolve, reject) => {
    const req = https.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || 8006,
        path: parsed.pathname + parsed.search,
        method,
        headers: {
          Authorization: `PVEAPIToken=${tokenId}=${tokenSecret}`,
          ...(contentTypeHeader ? { 'Content-Type': contentTypeHeader } : {}),
          ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
        },
        rejectUnauthorized: false,
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString()
          if (!res.statusCode || res.statusCode >= 400) {
            reject(new Error(`Proxmox API error ${res.statusCode}: ${raw}`))
            return
          }
          try {
            const json = JSON.parse(raw)
            resolve(json.data as T)
          } catch {
            reject(new Error(`Failed to parse Proxmox response: ${raw}`))
          }
        })
      }
    )

    req.on('error', reject)

    if (bodyStr) {
      req.write(bodyStr)
    }
    req.end()
  })
}
