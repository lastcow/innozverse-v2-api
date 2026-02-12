'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const typeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'SURFACE', label: 'Surface' },
  { value: 'LAPTOP', label: 'Laptop' },
  { value: 'XBOX', label: 'Xbox' },
]

const stockOptions = [
  { value: 'all', label: 'All Stock' },
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
]

interface ProductFiltersProps {
  currentType: string
  currentStock: string
  onTypeChange: (value: string) => void
  onStockChange: (value: string) => void
}

export function ProductFilters({ currentType, currentStock, onTypeChange, onStockChange }: ProductFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <Select value={currentType} onValueChange={onTypeChange}>
        <SelectTrigger className="w-[150px] rounded-xl border-gray-200 focus:ring-[#4379EE]">
          <SelectValue placeholder="Filter by type" />
        </SelectTrigger>
        <SelectContent>
          {typeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={currentStock} onValueChange={onStockChange}>
        <SelectTrigger className="w-[150px] rounded-xl border-gray-200 focus:ring-[#4379EE]">
          <SelectValue placeholder="Filter by stock" />
        </SelectTrigger>
        <SelectContent>
          {stockOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
