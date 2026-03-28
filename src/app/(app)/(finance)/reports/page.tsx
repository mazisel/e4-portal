'use client'

import { useState } from 'react'
import { useReports } from '@/hooks/useReports'
import { SummaryCards } from '@/components/reports/SummaryCards'
import { MonthlyBarChart } from '@/components/reports/MonthlyBarChart'
import { CategoryPieChart } from '@/components/reports/CategoryPieChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

export default function ReportsPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const { monthlyData, incomeByCategory, expenseByCategory, totals, loading } = useReports(year)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Raporlar</h1>
          <p className="text-sm text-muted-foreground">Yıllık gelir gider analizi</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setYear(y => y - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-semibold w-12 text-center">{year}</span>
          <Button variant="outline" size="icon" onClick={() => setYear(y => y + 1)} disabled={year >= new Date().getFullYear()}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <SummaryCards income={totals.income} expense={totals.expense} net={totals.net} />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aylık Karşılaştırma</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-72 w-full" /> : <MonthlyBarChart data={monthlyData} />}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-green-600">Gelir Kategorileri</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-56 w-full" /> : (
              <CategoryPieChart data={incomeByCategory} title="Gelir" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-red-600">Gider Kategorileri</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-56 w-full" /> : (
              <CategoryPieChart data={expenseByCategory} title="Gider" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aylık Detay</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-64 w-full" /> : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ay</TableHead>
                    <TableHead className="text-right text-green-600">Gelir</TableHead>
                    <TableHead className="text-right text-red-600">Gider</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData.map((m) => (
                    <TableRow key={m.month}>
                      <TableCell className="font-medium">{MONTHS[m.month - 1]}</TableCell>
                      <TableCell className="text-right text-green-600">{formatCurrency(m.income)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(m.expense)}</TableCell>
                      <TableCell className={`text-right font-semibold ${m.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {m.net >= 0 ? '+' : ''}{formatCurrency(m.net)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>Toplam</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(totals.income)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(totals.expense)}</TableCell>
                    <TableCell className={`text-right ${totals.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totals.net >= 0 ? '+' : ''}{formatCurrency(totals.net)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
