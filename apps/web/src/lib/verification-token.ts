import { createHmac, timingSafeEqual } from 'crypto'

function getSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('AUTH_SECRET or NEXTAUTH_SECRET must be set for verification tokens')
  }
  return secret
}

/**
 * Creates an HMAC-signed verification token encoding the verification ID,
 * email, and a 24-hour expiry. No DB fields needed — the token is self-contained.
 */
export function createVerificationToken(verificationId: string, email: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      id: verificationId,
      email,
      exp: Date.now() + 24 * 60 * 60 * 1000,
    })
  ).toString('base64url')

  const signature = createHmac('sha256', getSecret()).update(payload).digest('base64url')

  return `${payload}.${signature}`
}

/**
 * Verifies an HMAC-signed token. Returns the decoded payload if valid,
 * or null if the signature is invalid or the token is expired.
 */
export function verifyVerificationToken(
  token: string
): { id: string; email: string; exp: number } | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null

  const [payload, signature] = parts
  if (!payload || !signature) return null

  const expectedSig = createHmac('sha256', getSecret()).update(payload).digest('base64url')
  if (
    signature.length !== expectedSig.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
  ) {
    return null
  }

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (!data.id || !data.email || !data.exp || data.exp < Date.now()) return null
    return data
  } catch {
    return null
  }
}
