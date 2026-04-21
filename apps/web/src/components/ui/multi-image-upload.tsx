'use client'

import { useState, useRef, useCallback } from 'react'
import { ImagePlus, X, Upload } from 'lucide-react'
import Image from 'next/image'

interface MultiImageUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  accessToken?: string | null
  maxFiles?: number
}

interface UploadProgress {
  [key: string]: number // filename -> percentage
}

export function MultiImageUpload({
  value,
  onChange,
  accessToken,
  maxFiles = 10,
}: MultiImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [progress, setProgress] = useState<UploadProgress>({})

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  const handleFileSelect = useCallback(
    async (files: File[]) => {
      if (value.length + files.length > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`)
        return
      }

      setUploading(true)
      setError(null)
      const newProgress: UploadProgress = {}

      try {
        const formData = new FormData()
        files.forEach((file) => {
          formData.append('files', file)
        })

        const response = await fetch(`${apiUrl}/api/v1/upload/images`, {
          method: 'POST',
          headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Upload failed')
        }

        const data = await response.json()
        const uploadedUrls = data.images.map((img: { url: string }) => img.url)
        onChange([...value, ...uploadedUrls])
        setUrlInput('')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed'
        setError(message)
        console.error('Upload error:', err)
      } finally {
        setUploading(false)
        setProgress({})
      }
    },
    [value, onChange, maxFiles, apiUrl, accessToken]
  )

  const handleAddUrl = useCallback(async () => {
    if (!urlInput.trim()) {
      setError('Please enter a URL')
      return
    }

    // Validate URL
    try {
      new URL(urlInput)
    } catch {
      setError('Invalid URL format')
      return
    }

    if (value.length >= maxFiles) {
      setError(`Maximum ${maxFiles} images allowed`)
      return
    }

    setUploading(true)
    setError(null)

    try {
      const response = await fetch(`${apiUrl}/api/v1/upload/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ imageUrl: urlInput }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add URL')
      }

      const data = await response.json()
      const uploadedUrl = data.images[0]?.url
      if (uploadedUrl) {
        onChange([...value, uploadedUrl])
        setUrlInput('')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add URL'
      setError(message)
      console.error('URL add error:', err)
    } finally {
      setUploading(false)
    }
  }, [urlInput, value, onChange, maxFiles, apiUrl, accessToken])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer?.files) {
      handleFileSelect(Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/')))
    }
  }

  const handleRemove = useCallback(
    (urlToRemove: string) => {
      onChange(value.filter((url) => url !== urlToRemove))
    },
    [value, onChange]
  )

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Image Grid Preview */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {value.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group bg-gray-100"
            >
              <Image
                src={url}
                alt={`Preview ${index + 1}`}
                fill
                className="object-cover"
                sizes="120px"
              />
              <button
                type="button"
                onClick={() => handleRemove(url)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* File Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-dashed border-2 border-gray-300 hover:border-[#4379EE] rounded-xl py-6 px-4 text-center transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => e.target.files && handleFileSelect(Array.from(e.target.files))}
          disabled={uploading || value.length >= maxFiles}
          className="hidden"
        />
        <ImagePlus className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600 font-medium">
          {uploading ? 'Uploading...' : 'Drag images here or click to select'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {value.length} / {maxFiles} images
        </p>
      </div>

      {/* Direct URL Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Or paste image URL</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="https://example.com/image.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddUrl()}
            disabled={uploading || value.length >= maxFiles}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4379EE] focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            disabled={uploading || value.length >= maxFiles || !urlInput.trim()}
            className="px-4 py-2 bg-[#4379EE] hover:bg-[#3568d4] text-white rounded-lg text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
