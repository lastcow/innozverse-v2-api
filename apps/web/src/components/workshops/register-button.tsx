'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface RegisterButtonProps {
  workshopId: string
  isAuthenticated: boolean
  isRegistered: boolean
  isFull: boolean
  isPast: boolean
}

export function RegisterButton({
  workshopId,
  isAuthenticated,
  isRegistered: initialRegistered,
  isFull,
  isPast,
}: RegisterButtonProps) {
  const { accessToken } = useAuth()
  const [registered, setRegistered] = useState(initialRegistered)
  const [loading, setLoading] = useState(false)

  if (!isAuthenticated) {
    return (
      <Button asChild size="lg" className="w-full">
        <Link href={`/auth/login?callbackUrl=/workshops/${workshopId}`}>
          Log in to Register
        </Link>
      </Button>
    )
  }

  if (registered) {
    return (
      <Button
        size="lg"
        disabled
        className="w-full bg-green-600 text-white hover:bg-green-600"
      >
        You are Registered
      </Button>
    )
  }

  if (isPast) {
    return (
      <Button size="lg" disabled className="w-full">
        Workshop Ended
      </Button>
    )
  }

  if (isFull) {
    return (
      <Button size="lg" disabled className="w-full">
        Sold Out
      </Button>
    )
  }

  async function handleRegister() {
    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/api/v1/workshops/${workshopId}/register`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (res.ok) {
        setRegistered(true)
        toast.success('You have been registered for this workshop!')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Registration failed.')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="lg"
      className="w-full"
      onClick={handleRegister}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Registering...
        </>
      ) : (
        'Register Now'
      )}
    </Button>
  )
}
