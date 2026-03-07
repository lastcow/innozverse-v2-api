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
  ClipboardList,
  Users,
  BarChart,
  Tag,
  Calendar,
  Clock,
  Server,
  Monitor,
  Layers,
  Receipt,
  Megaphone,
  HardDrive,
  Network,
  Box,
  ChevronDown,
  Database,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import { useState } from 'react'

interface SidebarProps {
  userRole: 'USER' | 'ADMIN' | 'SYSTEM'
  mobileOpen: boolean
  onMobileClose: () => void
}

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  children?: NavItem[]
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
        { label: 'Overview', href: '/user/dashboard', icon: LayoutDashboard },
        { label: 'Purchase History', href: '/user/purchase-history', icon: Package },
        { label: 'My Workshops', href: '/user/workshops', icon: Calendar },
        { label: 'Studio Bookings', href: '/user/studio-bookings', icon: Clock },
        { label: 'My VMs', href: '/user/vms', icon: Monitor },
      ],
    },
  ]

  const adminNavigation: NavSection[] = isAdmin
    ? [
        {
          title: 'Management',
          items: [
            { label: 'Products', href: '/admin/products', icon: ShoppingBag },
            { label: 'Orders', href: '/admin/orders', icon: ClipboardList },
            { label: 'Discounts', href: '/admin/discounts', icon: Tag },
            { label: 'Workshops', href: '/admin/workshops', icon: Calendar },
            { label: 'Studio Slots', href: '/admin/studio-slots', icon: Clock },
            {
              label: 'Proxmox', href: '/admin/vms', icon: Database,
              children: [
                { label: 'VMs', href: '/admin/vms', icon: Server },
                { label: 'Storage', href: '/admin/storage', icon: HardDrive },
                { label: 'IP Pools', href: '/admin/ip-pool', icon: Network },
                { label: 'Templates', href: '/admin/vm-templates', icon: Box },
              ],
            },
            { label: 'Plans', href: '/admin/plans', icon: Layers },
            { label: 'Subscriptions', href: '/admin/subscriptions', icon: Receipt },
            { label: 'Announcements', href: '/admin/announcements', icon: Megaphone },
            { label: 'Users', href: '/admin/users', icon: Users },
            { label: 'Analytics', href: '/admin/analytics', icon: BarChart },
          ],
        },
      ]
    : []

  const settingsNavigation: NavSection[] = [
    {
      title: 'Settings',
      items: [
        { label: 'My Profile', href: '/user/settings/profile', icon: User },
        { label: 'Subscriptions', href: '/user/subscription', icon: CreditCard },
        { label: 'Services', href: '/user/services', icon: Server },
      ],
    },
  ]

  const allSections = [...commonNavigation, ...settingsNavigation, ...adminNavigation]

  const isActive = (href: string) => {
    if (href === '/user/dashboard') return pathname === '/user/dashboard'
    return pathname.startsWith(href)
  }

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const section of [...commonNavigation, ...settingsNavigation, ...adminNavigation]) {
      for (const item of section.items) {
        if (item.children?.some((child) => isActive(child.href))) {
          initial[item.label] = true
        }
      }
    }
    return initial
  })

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }))
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

                if (item.children) {
                  const isOpen = expandedMenus[item.label] ?? false
                  const hasActiveChild = item.children.some((child) => isActive(child.href))
                  return (
                    <div key={item.label}>
                      <button
                        onClick={() => toggleMenu(item.label)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-150 ${
                          hasActiveChild
                            ? 'text-[#4379EE]'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-[#4379EE]'
                        }`}
                      >
                        <Icon className="w-[18px] h-[18px] shrink-0" />
                        {item.label}
                        <ChevronDown className={`w-4 h-4 ml-auto transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.children.map((child) => {
                            const ChildIcon = child.icon
                            const active = isActive(child.href)
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={onMobileClose}
                                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                                  active
                                    ? 'bg-[#4379EE] text-white shadow-md shadow-blue-500/20'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-[#4379EE]'
                                }`}
                              >
                                <ChildIcon className="w-[16px] h-[16px] shrink-0" />
                                {child.label}
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                }

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
