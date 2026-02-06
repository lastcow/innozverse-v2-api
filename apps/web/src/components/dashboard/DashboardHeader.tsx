'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { Search, Bell, Sun, Menu, User, Settings, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface DashboardHeaderProps {
  onToggleSidebar?: () => void
}

export function DashboardHeader({ onToggleSidebar }: DashboardHeaderProps) {
  const { user } = useAuth()

  const initials = user?.email
    ? user.email.charAt(0).toUpperCase()
    : '?'

  const displayName = user?.email?.split('@')[0] || 'User'
  const displayEmail = user?.email || ''

  return (
    <header className="sticky top-0 z-30 h-16 lg:h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-8 shrink-0">
      {/* Left: Hamburger + Search */}
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-[#4379EE] transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-11 pr-4 py-3 bg-[#F5F6FA] border-0 rounded-full text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4379EE]/20 transition-colors"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1 ml-4">
        <button className="p-2.5 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors">
          <Sun className="w-5 h-5" />
        </button>
        <button className="relative p-2.5 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#4379EE] rounded-full ring-2 ring-white" />
        </button>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-2 w-10 h-10 rounded-full bg-[#4379EE] flex items-center justify-center text-white text-sm font-semibold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-shadow outline-none">
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-white rounded-xl shadow-lg border-gray-100 p-1"
          >
            <div className="px-3 py-2.5">
              <p className="text-sm font-semibold text-[#202224] truncate">{displayName}</p>
              <p className="text-xs text-gray-400 truncate">{displayEmail}</p>
            </div>
            <DropdownMenuSeparator className="bg-gray-100" />
            <DropdownMenuItem asChild className="rounded-lg cursor-pointer focus:bg-gray-50">
              <Link href="/dashboard/profile" className="flex items-center gap-3 px-3 py-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">My Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-lg cursor-pointer focus:bg-gray-50">
              <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2">
                <Settings className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-100" />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: '/' })}
              className="rounded-lg cursor-pointer focus:bg-red-50 text-red-600 focus:text-red-600"
            >
              <div className="flex items-center gap-3 px-3 py-2">
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Log Out</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
