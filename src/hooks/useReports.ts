'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { MonthlyReport, CategoryReport } from '@/types'

export function useReports(year: number) {
  const [monthlyData, setMonthlyData] = useState<MonthlyReport[]>([])
  const [incomeByCategory, setIncomeByCategory] = useState<CategoryReport[]>([])
  const [expenseByCategory, setExpenseByCategory] = useState<CategoryReport[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true)

      const dateFrom = `${year}-01-01`
      const dateTo = `${year}-12-31`

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*, category:categories(*)')
        .gte('transaction_date', dateFrom)
        .lte('transaction_date', dateTo)

      if (!transactions) {
        setLoading(false)
        return
      }

      // Monthly aggregation
      const monthly: Record<number, MonthlyReport> = {}
      for (let m = 1; m <= 12; m++) {
        monthly[m] = { year, month: m, income: 0, expense: 0, net: 0 }
      }
      transactions.forEach((t) => {
        const month = parseInt(t.transaction_date.split('-')[1])
        if (t.type === 'income') monthly[month].income += Number(t.amount)
        else monthly[month].expense += Number(t.amount)
        monthly[month].net = monthly[month].income - monthly[month].expense
      })
      setMonthlyData(Object.values(monthly))

      // Category aggregation
      const incomeMap: Record<string, CategoryReport> = {}
      const expenseMap: Record<string, CategoryReport> = {}
      transactions.forEach((t) => {
        const cat = t.category
        if (!cat) return
        const map = t.type === 'income' ? incomeMap : expenseMap
        if (!map[cat.id]) {
          map[cat.id] = {
            category_id: cat.id,
            category_name: cat.name,
            category_color: cat.color,
            total: 0,
          }
        }
        map[cat.id].total += Number(t.amount)
      })
      setIncomeByCategory(Object.values(incomeMap).sort((a, b) => b.total - a.total))
      setExpenseByCategory(Object.values(expenseMap).sort((a, b) => b.total - a.total))

      setLoading(false)
    }

    fetchReports()
  }, [year])

  const totals = monthlyData.reduce(
    (acc, m) => ({
      income: acc.income + m.income,
      expense: acc.expense + m.expense,
      net: acc.net + m.net,
    }),
    { income: 0, expense: 0, net: 0 }
  )

  return { monthlyData, incomeByCategory, expenseByCategory, totals, loading }
}

export function useDashboardStats() {
  const [stats, setStats] = useState({ monthIncome: 0, monthExpense: 0, monthNet: 0, ytdNet: 0 })
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      const now = new Date()
      const year = now.getFullYear()
      const monthNum = now.getMonth() + 1
      const month = String(monthNum).padStart(2, '0')
      const monthStart = `${year}-${month}-01`
      const monthEnd = `${year}-${month}-${new Date(year, monthNum, 0).getDate()}`
      const yearStart = `${year}-01-01`
      const yearEnd = `${year}-12-31`

      const [monthRes, ytdRes, recentRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('type, amount')
          .gte('transaction_date', monthStart)
          .lte('transaction_date', monthEnd),
        supabase
          .from('transactions')
          .select('type, amount')
          .gte('transaction_date', yearStart)
          .lte('transaction_date', yearEnd),
        supabase
          .from('transactions')
          .select('*, category:categories(*)')
          .order('transaction_date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      const calcStats = (rows: any[]) => {
        const income = rows.filter((r) => r.type === 'income').reduce((s, r) => s + Number(r.amount), 0)
        const expense = rows.filter((r) => r.type === 'expense').reduce((s, r) => s + Number(r.amount), 0)
        return { income, expense, net: income - expense }
      }

      const month_ = calcStats(monthRes.data || [])
      const ytd = calcStats(ytdRes.data || [])

      setStats({
        monthIncome: month_.income,
        monthExpense: month_.expense,
        monthNet: month_.net,
        ytdNet: ytd.net,
      })
      setRecentTransactions(recentRes.data || [])
      setLoading(false)
    }

    fetchStats()
  }, [])

  return { stats, recentTransactions, loading }
}
