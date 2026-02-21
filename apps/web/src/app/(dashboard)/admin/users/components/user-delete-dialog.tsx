'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { MockUser } from './user-table'

interface UserDeleteDialogProps {
  open: boolean
  user: MockUser | null
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}

const getDisplayName = (user: MockUser) => {
  const parts = [user.fname, user.mname, user.lname].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : user.email.split('@')[0]
}

export function UserDeleteDialog({ open, user, loading, onConfirm, onCancel }: UserDeleteDialogProps) {
  if (!user) return null

  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold text-[#202224]">
            Delete Member
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>Are you sure you want to delete this member? This action can be reversed by an administrator.</p>
              <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                <p className="font-medium text-[#202224]">{getDisplayName(user)}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
                <p className="text-sm text-gray-500">Role: {user.role} &middot; Status: {user.status}</p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="border-gray-200 rounded-xl"
            disabled={loading}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Member'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
