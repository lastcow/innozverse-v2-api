'use client'

export function DashboardFooter() {
  return (
    <footer className="h-16 bg-white border-t border-gray-100 flex items-center justify-between px-6">
      <p className="text-sm text-gray-500">
        &copy; {new Date().getFullYear()} <span className="font-semibold text-gray-600">Innozverse</span>. All Rights Reserved.
      </p>
      <p className="text-sm text-gray-400">
        Powered by Innozverse
      </p>
    </footer>
  )
}
