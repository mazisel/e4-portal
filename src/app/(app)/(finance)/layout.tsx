'use client'

import { FinanceGuard } from '@/components/FinanceGuard'
import { SharedDataProvider } from '@/contexts/SharedDataContext'

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <FinanceGuard>
      <SharedDataProvider>
        {children}
      </SharedDataProvider>
    </FinanceGuard>
  )
}
