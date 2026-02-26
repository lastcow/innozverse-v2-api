import { Suspense } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { AnnouncementBanner } from '@/components/layout/announcement-banner'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Suspense fallback={null}>
        <AnnouncementBanner />
      </Suspense>
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </>
  )
}
