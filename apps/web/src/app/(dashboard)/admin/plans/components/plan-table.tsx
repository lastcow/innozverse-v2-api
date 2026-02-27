'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

export interface VmConfigSpec {
  template: 'ubuntu' | 'kali'
  cores: number
  memory: number
  diskSize?: number
}

export interface Plan {
  id: string
  name: string
  level: number
  monthlyPrice: number
  annualTotalPrice: number
  description: string
  highlights: string[]
  vmConfig: VmConfigSpec[]
  active: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

interface PlanTableProps {
  plans: Plan[]
  loading: boolean
  onEdit: (plan: Plan) => void
  onDelete: (planId: string) => void
}

export function PlanTable({ plans, loading, onEdit, onDelete }: PlanTableProps) {
  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#4379EE] border-r-transparent"></div>
        <p className="mt-4 text-gray-500">Loading plans...</p>
      </div>
    )
  }

  if (plans.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500 text-lg">No plans found.</p>
        <p className="text-gray-400 text-sm mt-2">
          Click &ldquo;Add Plan&rdquo; to create your first subscription plan.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50/80">
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">
              Plan
            </th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">
              Level
            </th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">
              Monthly
            </th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">
              Status
            </th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">
              Highlights
            </th>
            <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {plans.map((plan) => (
            <tr
              key={plan.id}
              className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
            >
              <td className="px-5 py-4">
                <div className="flex flex-col min-w-0">
                  <p className="font-medium text-gray-900">{plan.name}</p>
                  <p className="text-xs text-gray-400 truncate max-w-[220px]">{plan.description}</p>
                </div>
              </td>
              <td className="px-5 py-4">
                <Badge className="bg-blue-50 text-blue-600 border-0">
                  {plan.level}
                </Badge>
              </td>
              <td className="px-5 py-4 font-medium text-[#202224]">
                {plan.monthlyPrice === 0 ? 'Free' : `$${formatCurrency(plan.monthlyPrice)}`}
              </td>
              <td className="px-5 py-4">
                <Badge className={plan.active ? 'bg-green-50 text-green-600 border-0' : 'bg-red-50 text-red-600 border-0'}>
                  {plan.active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td className="px-5 py-4">
                <div className="flex flex-wrap gap-1 max-w-[260px]">
                  {(plan.highlights as string[]).slice(0, 2).map((h, i) => (
                    <span key={i} className="text-xs text-gray-500 bg-gray-50 rounded px-1.5 py-0.5 truncate max-w-[240px]">
                      {h}
                    </span>
                  ))}
                  {(plan.highlights as string[]).length > 2 && (
                    <span className="text-xs text-gray-400">+{(plan.highlights as string[]).length - 2} more</span>
                  )}
                </div>
              </td>
              <td className="px-5 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(plan)}
                    className="w-8 h-8 rounded-lg bg-blue-50 text-[#4379EE] hover:bg-blue-100 flex items-center justify-center transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(plan.id)}
                    className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
