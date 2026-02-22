'use client'

import { useCallback, useEffect, useRef } from 'react'
import { ImagePlus, X } from 'lucide-react'
import Image from 'next/image'

interface MultiImageUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
}

declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget: (
        options: Record<string, unknown>,
        callback: (error: unknown, result: { event: string; info: { secure_url: string } }) => void
      ) => { open: () => void }
    }
  }
}

export function MultiImageUpload({ value, onChange }: MultiImageUploadProps) {
  const widgetRef = useRef<{ open: () => void } | null>(null)
  // Use refs to avoid stale closures in the widget callback
  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    // Load Cloudinary script if not already loaded
    if (document.getElementById('cloudinary-widget-script')) return

    const script = document.createElement('script')
    script.id = 'cloudinary-widget-script'
    script.src = 'https://upload-widget.cloudinary.com/latest/global/all.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  const openWidget = useCallback(() => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
      alert('Cloudinary is not configured')
      return
    }

    if (!window.cloudinary) {
      alert('Upload widget is still loading, please try again')
      return
    }

    widgetRef.current = window.cloudinary.createUploadWidget(
      {
        cloudName,
        uploadPreset,
        multiple: true,
        maxFiles: 10,
        sources: ['local', 'url', 'camera', 'google_drive', 'dropbox', 'instagram'],
        resourceType: 'image',
      },
      (error, result) => {
        if (!error && result.event === 'success') {
          // Read from refs to always get the latest value
          const current = valueRef.current
          const updated = [...current, result.info.secure_url]
          valueRef.current = updated
          onChangeRef.current(updated)
        }
      }
    )

    widgetRef.current.open()
  }, [])

  const handleRemove = useCallback(
    (urlToRemove: string) => {
      onChange(value.filter((url) => url !== urlToRemove))
    },
    [value, onChange]
  )

  return (
    <div className="space-y-3">
      {/* Image Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {value.map((url) => (
            <div
              key={url}
              className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group"
            >
              <Image
                src={url}
                alt="Workshop image"
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

      {/* Upload Button */}
      <button
        type="button"
        onClick={openWidget}
        className="w-full border-dashed border-2 border-gray-300 hover:border-[#4379EE] rounded-xl py-6 text-gray-500 hover:text-[#4379EE] flex items-center justify-center cursor-pointer transition-colors"
      >
        <ImagePlus className="w-5 h-5 mr-2" />
        Upload Images ({value.length})
      </button>
    </div>
  )
}
