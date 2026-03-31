'use client'

import { TopBar } from '@/components/layout/TopBar'

export default function ActivityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-background">
      <TopBar backHref="/home" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {children}
      </main>
    </div>
  )
}
