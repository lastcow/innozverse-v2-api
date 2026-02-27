'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TemplateForm, type VmTemplateRow } from './template-form'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface TemplateTableProps {
  data: VmTemplateRow[]
  loading: boolean
  accessToken?: string | null
  onRefresh: () => void
}

export function TemplateTable({ data, loading, accessToken, onRefresh }: TemplateTableProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<VmTemplateRow | null>(null)

  const handleCreate = () => {
    setEditingTemplate(null)
    setFormOpen(true)
  }

  const handleEdit = (template: VmTemplateRow) => {
    setEditingTemplate(template)
    setFormOpen(true)
  }

  const handleDelete = async (template: VmTemplateRow) => {
    if (!accessToken) return
    if (!confirm(`Delete template "${template.name}"?`)) return

    try {
      const response = await fetch(`${apiUrl}/api/v1/vm-templates/${template.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (response.ok) {
        onRefresh()
      }
    } catch {
      // Error handled silently
    }
  }

  const handleToggleActive = async (template: VmTemplateRow) => {
    if (!accessToken) return
    try {
      const response = await fetch(`${apiUrl}/api/v1/vm-templates/${template.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ active: !template.active }),
      })
      if (response.ok) {
        onRefresh()
      }
    } catch {
      // Error handled silently
    }
  }

  const handleFormSuccess = () => {
    setFormOpen(false)
    setEditingTemplate(null)
    onRefresh()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#4379EE] border-r-transparent"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {data.length} template{data.length !== 1 ? 's' : ''}
        </p>
        <Button
          onClick={handleCreate}
          size="sm"
          className="gap-2 bg-[#4379EE] hover:bg-[#3568d4] text-white"
        >
          <Plus className="w-4 h-4" />
          Add Template
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">No VM templates configured</p>
          <p className="text-sm mt-1">Add templates to map OS types to Proxmox template VMIDs.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">OS Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Template VMID</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((template) => (
                <tr key={template.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-4 font-medium text-gray-900">{template.name}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {template.osType}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-600">{template.vmid}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggleActive(template)}
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        template.active
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {template.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(template)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        title="Edit template"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(template)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete template"
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
      )}

      <TemplateForm
        open={formOpen}
        template={editingTemplate}
        accessToken={accessToken}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setFormOpen(false)
          setEditingTemplate(null)
        }}
      />
    </div>
  )
}
