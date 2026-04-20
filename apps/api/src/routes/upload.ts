import { Hono } from 'hono'
import { z } from 'zod'
import crypto from 'crypto'
import type { AuthContext } from '../types'
import { authMiddleware } from '../middleware/auth'

const app = new Hono<{ Variables: AuthContext }>()

interface CloudinaryUploadResponse {
  public_id: string
  secure_url: string
  url: string
  width: number
  height: number
  size: number
  format: string
}

interface UploadedImage {
  url: string
  publicId: string
}

// Validation schemas
const imageUrlSchema = z.object({
  imageUrl: z.string().url('Must be a valid URL'),
})

const batchUrlsSchema = z.object({
  imageUrls: z.array(z.string().url('Each item must be a valid URL')).min(1),
})

/**
 * Sign parameters for Cloudinary API request
 */
function signCloudinaryRequest(params: Record<string, string | number | boolean>): string {
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!apiSecret) {
    throw new Error('CLOUDINARY_API_SECRET not configured')
  }

  const sortedKeys = Object.keys(params).sort()
  const paramsStr = sortedKeys.map((key) => `${key}=${params[key]}`).join('&')
  const signature = crypto.createHash('sha1').update(paramsStr + apiSecret).digest('hex')

  return signature
}

/**
 * Upload file to Cloudinary
 */
async function uploadToCloudinary(buffer: Buffer, filename: string): Promise<UploadedImage> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY

  if (!cloudName || !apiKey) {
    throw new Error('Cloudinary credentials not configured')
  }

  const timestamp = Math.floor(Date.now() / 1000)

  const params = {
    timestamp,
    api_key: apiKey,
  }

  const signature = signCloudinaryRequest(params as Record<string, string | number>)

  const formData = new FormData()
  const blob = new Blob([buffer], { type: 'image/jpeg' })
  formData.append('file', blob, filename)
  formData.append('api_key', apiKey)
  formData.append('timestamp', timestamp.toString())
  formData.append('signature', signature)

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`

  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Cloudinary upload failed: ${error}`)
    }

    const data = (await response.json()) as CloudinaryUploadResponse
    return {
      url: data.secure_url,
      publicId: data.public_id,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to upload to Cloudinary: ${message}`)
  }
}

/**
 * POST /api/v1/upload/images
 * Supports two flows:
 * 1. Multipart file upload: files[] + JWT
 * 2. Direct URL: imageUrl string + JWT
 */
app.post('/api/v1/upload/images', authMiddleware, async (c) => {
  try {
    const contentType = c.req.header('content-type') || ''

    // Flow A: Multipart file upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await c.req.formData()
      const files = formData.getAll('files') as File[]

      if (!files || files.length === 0) {
        return c.json({ error: 'No files provided' }, 400)
      }

      // Max 10 files
      if (files.length > 10) {
        return c.json({ error: 'Maximum 10 files allowed' }, 400)
      }

      const images: UploadedImage[] = []

      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          return c.json({ error: `Invalid file type: ${file.type}` }, 400)
        }

        // Validate file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
          return c.json({ error: 'File size exceeds 50MB limit' }, 400)
        }

        const buffer = await file.arrayBuffer()
        const uploadedImage = await uploadToCloudinary(Buffer.from(buffer), file.name)
        images.push(uploadedImage)
      }

      return c.json({ images })
    }

    // Flow B: Direct URL upload
    if (contentType.includes('application/json')) {
      const body = await c.req.json()

      // Single URL
      if (body.imageUrl) {
        const parsed = imageUrlSchema.safeParse(body)
        if (!parsed.success) {
          return c.json({ error: parsed.error.errors[0].message }, 400)
        }

        return c.json({
          images: [{ url: parsed.data.imageUrl, publicId: '' }],
        })
      }

      // Batch URLs
      if (Array.isArray(body.imageUrls)) {
        const parsed = batchUrlsSchema.safeParse(body)
        if (!parsed.success) {
          return c.json({ error: parsed.error.errors[0].message }, 400)
        }

        const images = parsed.data.imageUrls.map((url) => ({
          url,
          publicId: '',
        }))

        return c.json({ images })
      }

      return c.json({ error: 'Either imageUrl or imageUrls is required' }, 400)
    }

    return c.json({ error: 'Content-Type must be multipart/form-data or application/json' }, 400)
  } catch (error) {
    console.error('Upload error:', error)
    const message = error instanceof Error ? error.message : 'Upload failed'
    return c.json({ error: message }, 500)
  }
})

/**
 * GET /api/v1/upload/test
 * Test endpoint to verify upload route is working
 */
app.get('/api/v1/upload/test', authMiddleware, (c) => {
  return c.json({
    message: 'Upload endpoint is healthy',
    cloudinaryConfigured: !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ),
  })
})

export default app
