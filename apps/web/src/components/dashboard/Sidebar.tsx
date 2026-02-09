'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  User,
  Package,
  CreditCard,
  ShoppingBag,
  Users,
  BarChart,
  Settings,
  Tag,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'

interface SidebarProps {
  userRole: 'USER' | 'ADMIN' | 'SYSTEM'
  mobileOpen: boolean
  onMobileClose: () => void
}

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavSection {
  title?: string
  items: NavItem[]
}

export function Sidebar({ userRole, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()

  const isAdmin = userRole === 'ADMIN' || userRole === 'SYSTEM'

  const commonNavigation: NavSection[] = [
    {
      title: 'Dashboard',
      items: [
        { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { label: 'My Profile', href: '/dashboard/profile', icon: User },
        { label: 'My Orders', href: '/dashboard/orders', icon: Package },
        { label: 'Subscriptions', href: '/dashboard/subscription', icon: CreditCard },
      ],
    },
  ]

  const adminNavigation: NavSection[] = isAdmin
    ? [
        {
          title: 'Management',
          items: [
            { label: 'Products', href: '/admin/products', icon: ShoppingBag },
            { label: 'Discounts', href: '/admin/discounts', icon: Tag },
            { label: 'Users', href: '/admin/users', icon: Users },
            { label: 'Analytics', href: '/admin/analytics', icon: BarChart },
          ],
        },
      ]
    : []

  const allSections = [...commonNavigation, ...adminNavigation]

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 h-16 flex items-center border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Innozverse"
            width={140}
            height={36}
            className="h-8 w-auto"
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-5 pb-2 space-y-6 overflow-y-auto">
        {allSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {section.title && (
              <p className="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                {section.title}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onMobileClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-150 ${
                      active
                        ? 'bg-[#4379EE] text-white shadow-md shadow-blue-500/20'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-[#4379EE]'
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Settings — pinned to bottom */}
      <div className="px-3 py-4 border-t border-gray-100">
        <Link
          href="/dashboard/settings"
          onClick={onMobileClose}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-150 w-full ${
            isActive('/dashboard/settings')
              ? 'bg-[#4379EE] text-white shadow-md shadow-blue-500/20'
              : 'text-gray-500 hover:bg-gray-50 hover:text-[#4379EE]'
          }`}
        >
          <Settings className="w-[18px] h-[18px]" />
          Settings
        </Link>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Sidebar — Sheet Drawer */}
      <Sheet open={mobileOpen} onOpenChange={(open) => !open && onMobileClose()}>
        <SheetContent
          side="left"
          className="w-64 p-0 border-r border-gray-100 bg-white"
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar — Fixed */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100 z-30">
        <SidebarContent />
      </aside>
    </>
  )
}
