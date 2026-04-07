'use client'

import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import {
  TrendingUp,
  CalendarDays,
  ClipboardList,
  Lock,
  ArrowUpRight,
  BarChart3,
  Clock3,
  Timer,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface HomeModule {
  href: string | null
  label: string
  description: string
  icon: LucideIcon
  metricIcon: LucideIcon
  metric: string
  locked: boolean
  lockMsg: string
  tone: string
}

function ModuleCard({ module, fullWidth = false }: { module: HomeModule; fullWidth?: boolean }) {
  const Icon = module.icon
  const MetricIcon = module.metricIcon

  const cardClasses = cn(
    'group overflow-hidden rounded-2xl border bg-card',
    fullWidth && 'md:col-span-2',
    module.locked
      ? 'cursor-not-allowed opacity-70'
      : 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md'
  )

  const content = (
    <>
      <div className={cn('flex items-center justify-between border-b px-4 py-3', module.tone)}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/20 text-white">
            <Icon className="h-4.5 w-4.5" />
          </span>
          <h2 className="text-sm font-semibold text-white">{module.label}</h2>
        </div>
        {module.locked ? (
          <Lock className="h-4 w-4 text-white/90" />
        ) : (
          <ArrowUpRight className="h-4 w-4 text-white/90 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        )}
      </div>

      <div className="space-y-4 p-4">
        <p className="text-sm leading-6 text-muted-foreground">
          {module.locked ? module.lockMsg : module.description}
        </p>

        <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MetricIcon className="h-3.5 w-3.5" />
            {module.metric}
          </span>
          <span className="font-medium">{module.locked ? 'Kapalı' : 'Aç'}</span>
        </div>
      </div>
    </>
  )

  if (module.locked || !module.href) {
    return <article className={cardClasses}>{content}</article>
  }

  return (
    <Link href={module.href} className={cardClasses}>
      {content}
    </Link>
  )
}

export default function HomePage() {
  const { user, profile } = useAuth()

  const modules: HomeModule[] = [
    {
      href: profile?.can_access_finance ? '/dashboard' : null,
      label: 'Finans',
      description: 'Gelir, gider ve raporları yönetin.',
      icon: TrendingUp,
      metricIcon: BarChart3,
      metric: 'Rapor ve özetler',
      locked: !profile?.can_access_finance,
      lockMsg: 'Bu modüle erişim yetkiniz bulunmamaktadır.',
      tone: 'bg-gradient-to-r from-emerald-500 to-teal-600',
    },
    {
      href: '/calendar',
      label: 'Takvim',
      description: 'Haftalık planınızı saatlik olarak düzenleyin.',
      icon: CalendarDays,
      metricIcon: Clock3,
      metric: 'Planlama görünümü',
      locked: false,
      lockMsg: '',
      tone: 'bg-gradient-to-r from-blue-500 to-indigo-600',
    },
    {
      href: '/activity',
      label: 'Aktivite',
      description: 'Günlük çalışmalarınızı ve harcadığınız süreyi kaydedin.',
      icon: ClipboardList,
      metricIcon: Timer,
      metric: 'Zaman takibi',
      locked: false,
      lockMsg: '',
      tone: 'bg-gradient-to-r from-fuchsia-500 to-pink-600',
    },
  ]

  const unlockedCount = modules.filter(module => !module.locked).length
  const todayLabel = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-full px-4 py-6 md:px-6">
      <div className="mx-auto max-w-4xl space-y-5">
        <section className="rounded-2xl border bg-card p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <p className="text-xs capitalize text-muted-foreground">{todayLabel}</p>
              <h1 className="text-2xl font-semibold leading-tight">Hoş geldiniz</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <div className="inline-flex items-center rounded-xl border px-3 py-1.5 text-xs text-muted-foreground">
              {unlockedCount}/{modules.length} modül erişime açık
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ModuleCard module={modules[0]} />
          <ModuleCard module={modules[1]} />
          <ModuleCard module={modules[2]} fullWidth />
        </section>
      </div>
    </div>
  )
}
