import { Megaphone } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  content: string
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function AnnouncementBanner() {
  let announcements: Announcement[] = []

  try {
    const res = await fetch(`${apiUrl}/api/v1/announcements/active`, {
      next: { revalidate: 60 },
    })
    if (res.ok) {
      const data = await res.json()
      announcements = data.announcements
    }
  } catch {
    // Silently fail — don't block page render
  }

  if (announcements.length === 0) return null

  return (
    <div className="w-full">
      {announcements.map((a) => (
        <div
          key={a.id}
          className="bg-yellow-50 border-b border-yellow-300 px-4 py-3"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
            <Megaphone className="w-5 h-5 text-yellow-600 shrink-0" />
            <p className="text-sm text-yellow-800 text-center">
              <span className="font-semibold">{a.title}</span>
              {' — '}
              {a.content}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
