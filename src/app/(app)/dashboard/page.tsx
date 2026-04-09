'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  TrendingUp, ClipboardList, CalendarDays, Users,
  ArrowUpRight,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface QuickLinkProps {
  href: string
  icon: typeof TrendingUp
  label: string
  description: string
  color: string
}

function QuickLink({ href, icon: Icon, label, description, color }: QuickLinkProps) {
  return (
    <Link href={href} className="group">
      <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-transparent hover:border-sidebar-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', color)}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <div className="mt-3">
            <h3 className="text-sm font-semibold">{label}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const canFinance = profile?.can_access_finance ?? false

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Günaydın' : now.getHours() < 18 ? 'İyi günler' : 'İyi akşamlar'
  const todayLabel = now.toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const modules: QuickLinkProps[] = []

  if (canFinance) {
    modules.push({
      href: '/transactions',
      icon: TrendingUp,
      label: 'Finans',
      description: 'Gelir, gider, kasa ve raporlar',
      color: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    })
  }

  modules.push({
    href: '/activity',
    icon: ClipboardList,
    label: 'Aktivite',
    description: 'Günlük çalışma kayıtları',
    color: 'bg-gradient-to-br from-fuchsia-500 to-pink-600',
  })

  modules.push({
    href: '/calendar',
    icon: CalendarDays,
    label: 'Takvim',
    description: 'Haftalık plan ve program',
    color: 'bg-gradient-to-br from-blue-500 to-indigo-600',
  })

  if (isAdmin) {
    modules.push({
      href: '/users',
      icon: Users,
      label: 'Kullanıcılar',
      description: 'Hesap ve yetki yönetimi',
      color: 'bg-gradient-to-br from-amber-500 to-orange-600',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-sidebar-primary/10">
        <CardContent className="p-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs text-muted-foreground capitalize">{todayLabel}</p>
              <h1 className="text-xl font-semibold mt-1">
                {greeting}, {profile?.full_name?.split(' ')[0] ?? 'Hoş geldiniz'}
              </h1>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Hızlı Erişim</h2>
        <div className={cn(
          'grid gap-4',
          modules.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        )}>
          {modules.map((module) => (
            <QuickLink key={module.href} {...module} />
          ))}
        </div>
      </div>
    </div>
  )
}
