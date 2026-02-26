'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { AnnouncementTable, type Announcement } from './components/announcement-table'
import { AnnouncementForm } from './components/announcement-form'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function AdminAnnouncementsPage() {
  const { accessToken, isLoading: authLoading } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAnnouncements = useCallback(async () => {
    if (!accessToken) return
    try {
      setLoading(true)
      const response = await fetch(`${apiUrl}/api/v1/announcements`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data.announcements)
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error)
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (accessToken) {
      fetchAnnouncements()
    }
  }, [accessToken, fetchAnnouncements])

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return

    try {
      const response = await fetch(`${apiUrl}/api/v1/announcements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (response.ok) {
        await fetchAnnouncements()
      } else {
        const err = await response.json()
        alert(err.error || 'Failed to delete announcement')
      }
    } catch (error) {
      console.error('Failed to delete announcement:', error)
      alert('Failed to delete announcement')
    }
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setEditingAnnouncement(null)
    fetchAnnouncements()
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setEditingAnnouncement(null)
  }

  if (authLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#4379EE] border-r-transparent"></div>
      </div>
    )
  }

  const liveCount = announcements.filter((a) => {
    if (!a.active) return false
    const now = new Date()
    return new Date(a.startDate) <= now && new Date(a.endDate) >= now
  }).length

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#202224]">Announcements</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage announcements displayed on the homepage
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-400 font-medium">Total</p>
          <p className="text-2xl font-bold text-[#202224] mt-1">{announcements.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-400 font-medium">Live Now</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{liveCount}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-400 font-medium">Inactive / Expired</p>
          <p className="text-2xl font-bold text-gray-400 mt-1">{announcements.length - liveCount}</p>
        </div>
      </div>

      {/* Add Announcement Button */}
      <div className="flex items-center justify-end mb-6">
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-[#4379EE] hover:bg-[#3568d4] text-white rounded-xl px-5"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Announcement
        </Button>
      </div>

      {/* Announcement Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <AnnouncementTable
          announcements={announcements}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Announcement Form Dialog */}
      <AnnouncementForm
        open={isFormOpen}
        announcement={editingAnnouncement}
        accessToken={accessToken}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    </div>
  )
}
