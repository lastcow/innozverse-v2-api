'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { registerForWorkshop } from '@/app/actions/workshop'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

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
      const result = await registerForWorkshop(workshopId)
      if (result.success) {
        setRegistered(true)
        toast.success('You have been registered for this workshop!')
      } else {
        toast.error(result.error || 'Registration failed.')
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
