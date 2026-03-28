'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { TrendingUp, CalendarDays, Lock } from 'lucide-react'

export default function HomePage() {
  const { user, profile } = useAuth()

  const modules = [
    {
      href: profile?.can_access_finance ? '/dashboard' : null,
      label: 'Finans',
      description: 'Gelir, gider ve raporları yönetin',
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-600',
      locked: !profile?.can_access_finance,
      lockMsg: 'Bu modüle erişim yetkiniz bulunmamaktadır.',
    },
    {
      href: '/calendar',
      label: 'Takvim',
      description: 'Haftalık planınızı saatlik olarak düzenleyin',
      icon: CalendarDays,
      color: 'from-blue-500 to-indigo-600',
      locked: false,
      lockMsg: '',
    },
  ]

  return (
    <div className="min-h-full flex flex-col items-center justify-center py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold">Hoş geldiniz</h1>
        <p className="text-muted-foreground mt-1 text-sm">{user?.email}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl px-4">
        {modules.map((mod) => {
          const Icon = mod.icon

          if (mod.locked) {
            return (
              <div
                key={mod.label}
                className="relative rounded-2xl overflow-hidden border bg-card opacity-60 cursor-not-allowed select-none"
              >
                <div className={`bg-gradient-to-br ${mod.color} p-8 flex justify-center`}>
                  <Icon className="w-12 h-12 text-white" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-semibold">{mod.label}</h2>
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">{mod.lockMsg}</p>
                </div>
              </div>
            )
          }

          return (
            <Link
              key={mod.label}
              href={mod.href!}
              className="rounded-2xl overflow-hidden border bg-card hover:shadow-lg transition-shadow group"
            >
              <div className={`bg-gradient-to-br ${mod.color} p-8 flex justify-center group-hover:brightness-110 transition-all`}>
                <Icon className="w-12 h-12 text-white" />
              </div>
              <div className="p-5">
                <h2 className="text-lg font-semibold mb-1">{mod.label}</h2>
                <p className="text-sm text-muted-foreground">{mod.description}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
