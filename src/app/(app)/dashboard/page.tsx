'use client'

import Link from 'next/link'
import { useDashboardStats } from '@/hooks/useReports'
import { SummaryCards } from '@/components/reports/SummaryCards'
import { TransactionTable } from '@/components/transactions/TransactionTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardPage() {
  const { stats, recentTransactions, loading } = useDashboardStats()

  const now = new Date()
  const monthName = now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{monthName} özeti</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/transactions/new">
            <Plus className="w-4 h-4" />
            Yeni İşlem
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <SummaryCards
          income={stats.monthIncome}
          expense={stats.monthExpense}
          net={stats.monthNet}
          extra={{ label: 'Yıllık Net', value: stats.ytdNet }}
        />
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Son İşlemler</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/transactions">Tümünü gör →</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <TransactionTable
            transactions={recentTransactions}
            loading={loading}
            showActions={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}
