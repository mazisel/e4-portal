'use client'

import { useState } from 'react'
import { FinanceSidebar } from '@/components/layout/FinanceSidebar'
import { TopBar } from '@/components/layout/TopBar'
import { FinanceGuard } from '@/components/FinanceGuard'

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <FinanceGuard>
      <div className="flex h-screen overflow-hidden bg-background">
        <FinanceSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <TopBar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </FinanceGuard>
  )
}
