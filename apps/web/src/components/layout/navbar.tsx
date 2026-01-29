'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export function Navbar() {
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth()

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <div className="flex flex-1 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-serif text-2xl font-bold text-foreground hover:text-primary transition-colors">
              Innozverse
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Button asChild variant="ghost" size="sm">
              <Link href="/products">
                Products
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/cart">
                Cart
              </Link>
            </Button>
            {isAuthenticated && (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/orders">
                    Orders
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard">
                    Dashboard
                  </Link>
                </Button>
                {isAdmin && (
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/admin">
                      Admin
                    </Link>
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="h-8 w-20 animate-pulse rounded-lg bg-muted" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block text-sm text-muted-foreground">
                  {user?.email}
                </span>
                <Button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  variant="ghost"
                  size="sm"
                >
                  Sign out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/auth/login">
                    Sign in
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/auth/register">
                    Sign up
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
