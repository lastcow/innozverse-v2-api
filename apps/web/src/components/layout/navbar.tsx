'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/use-auth'
import { signOut } from 'next-auth/react'
import { X, User, LogOut, LayoutDashboard } from 'lucide-react'

export function Navbar() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-stone-200/50 bg-[#F4F3EE]/80 backdrop-blur-md">
      <div className="container flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Innozverse"
            width={160}
            height={40}
            className="h-8 w-auto"
            priority
          />
        </Link>

        {/* Right Side: Navigation Links + Auth */}
        <div className="flex items-center gap-8">
          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="https://docs.innozverse.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[15px] text-stone-600 hover:text-stone-900 transition-colors"
            >
              Knowledge Base
            </a>
            <Link
              href="/products"
              className="text-[15px] text-stone-600 hover:text-stone-900 transition-colors"
            >
              Product
            </Link>
            <Link
              href="/pricing"
              className="text-[15px] text-stone-600 hover:text-stone-900 transition-colors"
            >
              Plans & Pricing
            </Link>
            <Link
              href="/company"
              className="text-[15px] text-stone-600 hover:text-stone-900 transition-colors"
            >
              Company
            </Link>
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-6">
          {isLoading ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-stone-200/50" />
          ) : isAuthenticated ? (
            <div className="hidden md:flex items-center gap-6">
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  onBlur={() => setTimeout(() => setUserDropdownOpen(false), 200)}
                  className="flex items-center gap-2 text-[15px] text-stone-600 hover:text-stone-900 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-[#1C1917] flex items-center justify-center text-white font-medium text-xs">
                    {user?.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden lg:inline-block">
                    {user?.email?.split('@')[0]}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#F4F3EE] rounded-lg shadow-lg border border-stone-200/50 py-1 backdrop-blur-md">
                    <Link
                      href="/user/dashboard"
                      className="flex items-center gap-3 px-4 py-2.5 text-[15px] text-stone-700 hover:text-stone-900 transition-colors"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link
                      href="/orders"
                      className="flex items-center gap-3 px-4 py-2.5 text-[15px] text-stone-700 hover:text-stone-900 transition-colors"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Orders
                    </Link>
                    <div className="my-1 border-t border-stone-200/50" />
                    <button
                      onClick={() => {
                        signOut({ callbackUrl: '/' })
                        setUserDropdownOpen(false)
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 text-[15px] text-red-600 hover:text-red-700 transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/auth/login"
                className="text-[15px] text-stone-600 hover:text-stone-900 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center px-5 py-2 text-[15px] font-medium text-white bg-[#1C1917] hover:bg-stone-800 rounded-full transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-stone-600 hover:text-stone-900 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <span className="text-[15px] font-medium">Menu</span>
            )}
          </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Full Screen Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-40 md:hidden bg-[#F4F3EE] backdrop-blur-md">
          <div className="container px-4 py-8 space-y-1">
            <a
              href="https://docs.innozverse.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-3 text-lg text-stone-700 hover:text-stone-900 transition-colors"
            >
              Knowledge Base
            </a>
            <Link
              href="/products"
              className="block px-4 py-3 text-lg text-stone-700 hover:text-stone-900 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Product
            </Link>
            <Link
              href="/pricing"
              className="block px-4 py-3 text-lg text-stone-700 hover:text-stone-900 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Plans & Pricing
            </Link>
            <Link
              href="/company"
              className="block px-4 py-3 text-lg text-stone-700 hover:text-stone-900 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Company
            </Link>

            {isAuthenticated ? (
              <>
                <div className="my-6 border-t border-stone-200/50" />
                <Link
                  href="/user/dashboard"
                  className="block px-4 py-3 text-lg text-stone-700 hover:text-stone-900 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/orders"
                  className="block px-4 py-3 text-lg text-stone-700 hover:text-stone-900 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Orders
                </Link>
                <button
                  onClick={() => {
                    signOut({ callbackUrl: '/' })
                    setMobileMenuOpen(false)
                  }}
                  className="block w-full text-left px-4 py-3 text-lg text-red-600 hover:text-red-700 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <div className="my-6 border-t border-stone-200/50" />
                <Link
                  href="/auth/login"
                  className="block px-4 py-3 text-lg text-stone-700 hover:text-stone-900 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/auth/register"
                  className="block mx-4 mt-4 px-6 py-3 bg-[#1C1917] text-white hover:bg-stone-800 rounded-full transition-colors text-center font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
