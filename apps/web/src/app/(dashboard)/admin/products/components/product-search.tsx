'use client'

import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface ProductSearchProps {
  value: string
  onChange: (value: string) => void
}

export function ProductSearch({ value, onChange }: ProductSearchProps) {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        type="text"
        placeholder="Search by name..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-9 rounded-xl border-gray-200 focus-visible:ring-[#4379EE]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
