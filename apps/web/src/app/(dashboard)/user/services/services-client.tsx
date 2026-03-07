'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Server, ExternalLink } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cancelServiceSubscription } from '@/app/actions/service'
import { toast } from 'sonner'

interface ServiceSubscription {
  id: string
  serviceName: string
  stripeSubscriptionId: string | null
  status: 'PENDING_SETUP' | 'IN_PROGRESS' | 'RUNNING' | 'CANCELED' | 'SUSPENDED'
  billingPeriod: string
  monthlyPrice: number
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  canceledAt: string | null
  createdAt: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING_SETUP: { label: 'Pending Setup', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  RUNNING: { label: 'Running', className: 'bg-green-100 text-green-800 border-green-200' },
  CANCELED: { label: 'Canceled', className: 'bg-gray-100 text-gray-800 border-gray-200' },
  SUSPENDED: { label: 'Suspended', className: 'bg-red-100 text-red-800 border-red-200' },
}

export default function ServicesClient({ services }: { services: ServiceSubscription[] }) {
  const [canceling, setCanceling] = useState<string | null>(null)

  const handleCancel = async (stripeSubscriptionId: string) => {
    setCanceling(stripeSubscriptionId)
    try {
      const result = await cancelServiceSubscription(stripeSubscriptionId)
      if (result.success) {
        toast.success('Service will be canceled at the end of the billing period')
        window.location.reload()
      } else {
        toast.error(result.error || 'Failed to cancel service')
      }
    } catch {
      toast.error('Failed to cancel service')
    } finally {
      setCanceling(null)
    }
  }

  if (services.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Services</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Server className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No active services</h3>
            <p className="text-gray-500 mb-6 max-w-sm">
              You don&apos;t have any active service subscriptions yet. Check out OpenClaw for a fully managed AI assistant.
            </p>
            <Button asChild>
              <Link href="/openclaw">
                Explore OpenClaw <ExternalLink className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Services</h1>
      <div className="grid gap-4">
        {services.map((service) => {
          const status = statusConfig[service.status] || { label: service.status, className: 'bg-gray-100 text-gray-800 border-gray-200' }
          const isPendingCancel = !!service.canceledAt && service.status !== 'CANCELED'

          return (
            <Card key={service.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Server className="w-5 h-5 text-gray-500" />
                  {service.serviceName}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {isPendingCancel && (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      Cancels at period end
                    </Badge>
                  )}
                  <Badge variant="outline" className={status.className}>
                    {status.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Billing</p>
                    <p className="font-medium capitalize">{service.billingPeriod}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Price</p>
                    <p className="font-medium">
                      ${service.monthlyPrice.toFixed(2)}
                      {service.billingPeriod === 'annual' ? '/year' : '/month'}
                    </p>
                  </div>
                  {service.currentPeriodStart && (
                    <div>
                      <p className="text-gray-500">Period Start</p>
                      <p className="font-medium">
                        {new Date(service.currentPeriodStart).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {service.currentPeriodEnd && (
                    <div>
                      <p className="text-gray-500">Period End</p>
                      <p className="font-medium">
                        {new Date(service.currentPeriodEnd).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {service.stripeSubscriptionId && !isPendingCancel && service.status !== 'CANCELED' && (
                  <div className="flex justify-end">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          Cancel Service
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel {service.serviceName}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Your service will remain active until the end of your current billing period
                            {service.currentPeriodEnd && (
                              <> ({new Date(service.currentPeriodEnd).toLocaleDateString()})</>
                            )}. After that, it will be deactivated.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Service</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleCancel(service.stripeSubscriptionId!)}
                            disabled={canceling === service.stripeSubscriptionId}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {canceling === service.stripeSubscriptionId ? 'Canceling...' : 'Cancel Service'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
