'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp, TrendingDown, ClipboardList, CalendarDays,
  ArrowUpRight, Clock, AlertCircle, CheckCircle2,
  Wallet, Timer, Users,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

// ——— Types ———

interface DashboardStats {
  // Finance
  monthIncome: number
  monthExpense: number
  monthNet: number
  recentTransactionCount: number
  // Activity
  todayMyActivity: { title: string; duration_minutes: number }[]
  todayTotalMinutes: number
  missingActivityUsers: string[]
  totalActiveUsers: number
  // Calendar
  todayPlans: { title: string; hour: number; hour_end: number }[]
}

// ——— Helpers ———

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount)
}

function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}dk`
  if (m === 0) return `${h}sa`
  return `${h}sa ${m}dk`
}

function formatHour(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`
}

// ——— Widget Components ———

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: typeof TrendingUp
  label: string
  value: string
  sub?: string
  color: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', color)}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold truncate">{value}</p>
            {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityWidget({ activities, totalMinutes, loading }: {
  activities: DashboardStats['todayMyActivity']
  totalMinutes: number
  loading: boolean
}) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Bugünkü Aktivitem</CardTitle>
        <Link href="/activity" className="text-xs text-sidebar-primary hover:underline flex items-center gap-1">
          Git <ArrowUpRight className="w-3 h-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-8" />)}
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Bugün henüz aktivite eklenmemiş</p>
            <Link href="/activity" className="text-xs text-sidebar-primary hover:underline">
              Aktivite ekle →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.slice(0, 5).map((a, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2">
                <span className="text-sm truncate">{a.title}</span>
                <Badge variant="secondary" className="shrink-0 text-[11px]">
                  {formatMinutes(a.duration_minutes)}
                </Badge>
              </div>
            ))}
            {activities.length > 5 && (
              <p className="text-xs text-muted-foreground text-center">+{activities.length - 5} daha</p>
            )}
            <div className="flex items-center justify-between border-t pt-2 mt-2">
              <span className="text-xs text-muted-foreground">Toplam</span>
              <span className="text-sm font-semibold">{formatMinutes(totalMinutes)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CalendarWidget({ plans, loading }: {
  plans: DashboardStats['todayPlans']
  loading: boolean
}) {
  const now = new Date()
  const currentHour = now.getHours()

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Bugünün Programı</CardTitle>
        <Link href="/calendar" className="text-xs text-sidebar-primary hover:underline flex items-center gap-1">
          Git <ArrowUpRight className="w-3 h-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-8" />)}
          </div>
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <CalendarDays className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Bugün planlanmış etkinlik yok</p>
            <Link href="/calendar" className="text-xs text-sidebar-primary hover:underline">
              Plan ekle →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {plans.map((p, i) => {
              const isPast = p.hour_end <= currentHour
              const isCurrent = p.hour <= currentHour && p.hour_end > currentHour
              return (
                <div
                  key={i}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2',
                    isCurrent ? 'bg-sidebar-primary/10 border border-sidebar-primary/20' :
                    isPast ? 'bg-muted/30 opacity-60' : 'bg-muted/50'
                  )}
                >
                  <div className="text-xs text-muted-foreground w-16 shrink-0">
                    {formatHour(p.hour)} - {formatHour(p.hour_end)}
                  </div>
                  <span className="text-sm truncate">{p.title}</span>
                  {isCurrent && (
                    <Badge variant="secondary" className="ml-auto shrink-0 text-[10px] text-sidebar-primary">
                      Şimdi
                    </Badge>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function MissingActivityWidget({ missingUsers, totalUsers, loading }: {
  missingUsers: string[]
  totalUsers: number
  loading: boolean
}) {
  const completedCount = totalUsers - missingUsers.length

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Aktivite Durumu</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-20" />
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Tamamlayan</span>
                  <span className="font-medium">{completedCount}/{totalUsers}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: totalUsers > 0 ? `${(completedCount / totalUsers) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            </div>
            {missingUsers.length === 0 ? (
              <div className="flex items-center gap-2 text-emerald-500">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">Herkes aktivite girmiş!</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Henüz girmeyenler:</p>
                <div className="flex flex-wrap gap-1.5">
                  {missingUsers.slice(0, 8).map((name, i) => (
                    <Badge key={i} variant="outline" className="text-[11px] text-destructive border-destructive/30">
                      {name}
                    </Badge>
                  ))}
                  {missingUsers.length > 8 && (
                    <Badge variant="outline" className="text-[11px]">
                      +{missingUsers.length - 8}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ——— Main Dashboard ———

export default function DashboardPage() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const canFinance = profile?.can_access_finance ?? false
  const [supabase] = useState(() => createClient())
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    monthIncome: 0,
    monthExpense: 0,
    monthNet: 0,
    recentTransactionCount: 0,
    todayMyActivity: [],
    todayTotalMinutes: 0,
    missingActivityUsers: [],
    totalActiveUsers: 0,
    todayPlans: [],
  })

  const fetchDashboardData = useCallback(async () => {
    if (!profile) return
    setLoading(true)

    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()

    // Week start (Monday)
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - dayOfWeek + 1)
    const weekStartStr = weekStart.toISOString().split('T')[0]

    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

    try {
      const queries: Promise<any>[] = []

      // 1. My today's activity
      queries.push(
        supabase
          .from('activity_logs')
          .select('title, duration_minutes')
          .eq('user_id', profile.id)
          .eq('date', today)
          .order('created_at', { ascending: false })
      )

      // 2. All today's activity (for missing users check)
      queries.push(
        supabase
          .from('activity_logs')
          .select('user_id')
          .eq('date', today)
      )

      // 3. All active profiles
      queries.push(
        supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('is_active', true)
      )

      // 4. My today's calendar plans
      queries.push(
        supabase
          .from('calendar_plans')
          .select('title, hour, hour_end')
          .eq('user_id', profile.id)
          .eq('week_start', weekStartStr)
          .eq('day_of_week', dayOfWeek)
          .order('hour', { ascending: true })
      )

      // 5. Finance (only if user has access)
      if (canFinance) {
        queries.push(
          supabase
            .from('transactions')
            .select('type, amount')
            .gte('transaction_date', monthStart)
            .lte('transaction_date', today)
        )
      }

      const results = await Promise.all(queries)

      const [myActivity, allActivity, profiles, calendarPlans, transactions] = results

      // Process activity
      const myLogs = (myActivity.data ?? []) as { title: string; duration_minutes: number }[]
      const todayTotalMinutes = myLogs.reduce((sum: number, l: { duration_minutes: number }) => sum + (l.duration_minutes || 0), 0)

      // Missing activity users
      const activeUserIds = new Set((allActivity.data ?? []).map((l: { user_id: string }) => l.user_id))
      const allProfiles = (profiles.data ?? []) as { id: string; full_name: string | null; email: string | null }[]
      const missingUsers = allProfiles
        .filter(p => !activeUserIds.has(p.id))
        .map(p => p.full_name?.split(' ')[0] ?? p.email?.split('@')[0] ?? '?')

      // Calendar
      const todayPlans = (calendarPlans.data ?? []) as { title: string; hour: number; hour_end: number }[]

      // Finance
      let monthIncome = 0
      let monthExpense = 0
      if (canFinance && transactions?.data) {
        for (const tx of transactions.data as { type: string; amount: number }[]) {
          if (tx.type === 'income') monthIncome += tx.amount
          else monthExpense += tx.amount
        }
      }

      setStats({
        monthIncome,
        monthExpense,
        monthNet: monthIncome - monthExpense,
        recentTransactionCount: transactions?.data?.length ?? 0,
        todayMyActivity: myLogs,
        todayTotalMinutes,
        missingActivityUsers: missingUsers,
        totalActiveUsers: allProfiles.length,
        todayPlans,
      })
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase, profile, canFinance])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Günaydın' : now.getHours() < 18 ? 'İyi günler' : 'İyi akşamlar'
  const todayLabel = now.toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground capitalize">{todayLabel}</p>
          <h1 className="text-xl font-semibold mt-0.5">
            {greeting}, {profile?.full_name?.split(' ')[0] ?? 'Hoş geldiniz'}
          </h1>
        </div>
      </div>

      {/* Stat Cards */}
      <div className={cn(
        'grid gap-3',
        canFinance ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'
      )}>
        {canFinance && (
          <>
            <StatCard
              icon={TrendingUp}
              label="Bu Ay Gelir"
              value={formatCurrency(stats.monthIncome)}
              color="bg-emerald-500"
            />
            <StatCard
              icon={TrendingDown}
              label="Bu Ay Gider"
              value={formatCurrency(stats.monthExpense)}
              color="bg-red-500"
            />
          </>
        )}
        <StatCard
          icon={Timer}
          label="Bugün Çalışma"
          value={stats.todayTotalMinutes > 0 ? formatMinutes(stats.todayTotalMinutes) : '—'}
          sub={`${stats.todayMyActivity.length} kayıt`}
          color="bg-fuchsia-500"
        />
        <StatCard
          icon={CalendarDays}
          label="Bugün Program"
          value={`${stats.todayPlans.length} etkinlik`}
          color="bg-blue-500"
        />
      </div>

      {/* Main Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left: Activity */}
        <div className="space-y-4">
          <ActivityWidget
            activities={stats.todayMyActivity}
            totalMinutes={stats.todayTotalMinutes}
            loading={loading}
          />
        </div>

        {/* Right: Calendar */}
        <div className="space-y-4">
          <CalendarWidget
            plans={stats.todayPlans}
            loading={loading}
          />
        </div>
      </div>

      {/* Activity Status (visible to all) */}
      <MissingActivityWidget
        missingUsers={stats.missingActivityUsers}
        totalUsers={stats.totalActiveUsers}
        loading={loading}
      />
    </div>
  )
}
