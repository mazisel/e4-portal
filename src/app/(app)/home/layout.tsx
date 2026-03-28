'use client'

import { TopBar } from '@/components/layout/TopBar'

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopBar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
