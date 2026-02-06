'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { DashboardHeader } from './DashboardHeader'
import { DashboardFooter } from './DashboardFooter'

interface DashboardShellProps {
  userRole: 'USER' | 'ADMIN' | 'SYSTEM'
  children: React.ReactNode
}

export function DashboardShell({ userRole, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Sidebar
        userRole={userRole}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <div className="ml-0 lg:ml-64 min-h-screen flex flex-col">
        <DashboardHeader onToggleSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 pt-16 lg:pt-0">
          <div className="w-full px-6 py-6">
            {children}
          </div>
        </main>

        <DashboardFooter />
      </div>
    </div>
  )
}
