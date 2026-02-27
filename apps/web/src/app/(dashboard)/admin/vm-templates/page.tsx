'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { TemplateTable } from './components/template-table'
import type { VmTemplateRow } from './components/template-form'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function AdminVmTemplatesPage() {
  const { accessToken, isLoading: authLoading } = useAuth()
  const [templates, setTemplates] = useState<VmTemplateRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTemplates = useCallback(async () => {
    if (!accessToken) return
    try {
      setLoading(true)
      const response = await fetch(`${apiUrl}/api/v1/vm-templates`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates)
      }
    } catch {
      // Error handled silently
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (accessToken) {
      fetchTemplates()
    }
  }, [accessToken, fetchTemplates])

  if (authLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#4379EE] border-r-transparent"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#202224]">VM Templates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage Proxmox VM templates for provisioning
          </p>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <TemplateTable
          data={templates}
          loading={loading}
          accessToken={accessToken}
          onRefresh={fetchTemplates}
        />
      </div>
    </div>
  )
}
