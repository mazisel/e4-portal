'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ArrowLeftRight, Tag, BarChart3,
  Users, Building2, SlidersHorizontal, Truck, X,
  Wallet, CreditCard, HandCoins, CalendarDays,
  ClipboardList, TrendingUp, LogOut, ChevronDown, Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'

interface SubItem {
  href: string
  label: string
  icon: typeof LayoutDashboard
}

const financeItems: SubItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'İşlemler', icon: ArrowLeftRight },
  { href: '/kasa', label: 'Kasa', icon: Wallet },
  { href: '/debts', label: 'Borçlar', icon: CreditCard },
  { href: '/advances', label: 'Avanslar', icon: HandCoins },
  { href: '/categories', label: 'Kategoriler', icon: Tag },
  { href: '/reports', label: 'Raporlar', icon: BarChart3 },
  { href: '/staff', label: 'Personeller', icon: Users },
  { href: '/customers', label: 'Müşteriler', icon: Building2 },
  { href: '/suppliers', label: 'Tedarikçiler', icon: Truck },
  { href: '/fixed', label: 'Sabitler', icon: SlidersHorizontal },
]

const financePaths = new Set(financeItems.map(i => i.href))

interface AppSidebarProps {
  open: boolean
  onClose: () => void
}

export function AppSidebar({ open, onClose }: AppSidebarProps) {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const canFinance = profile?.can_access_finance ?? false

  const isFinancePath = financePaths.has(pathname) || [...financePaths].some(p => pathname.startsWith(p + '/'))
  const [financeOpen, setFinanceOpen] = useState(isFinancePath)

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-60 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary/20">
              <span className="text-sm font-bold text-sidebar-primary">e4</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-sidebar-foreground">e4 Portal</p>
              <p className="text-[10px] text-muted-foreground">v1.0</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-sidebar-accent">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-1">

          {/* Finans — accordion */}
          {canFinance && (
            <div>
              <button
                onClick={() => setFinanceOpen(!financeOpen)}
                className={cn(
                  'flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isFinancePath
                    ? 'text-sidebar-primary'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                )}
              >
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">Finans</span>
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', financeOpen && 'rotate-180')} />
              </button>
              {financeOpen && (
                <div className="ml-3 mt-1 space-y-0.5 border-l border-sidebar-border pl-3">
                  {financeItems.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors',
                          active
                            ? 'bg-sidebar-primary/15 text-sidebar-primary'
                            : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                        )}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Aktivite */}
          <Link
            href="/activity"
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive('/activity')
                ? 'bg-sidebar-primary/15 text-sidebar-primary'
                : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
            )}
          >
            <ClipboardList className="w-4 h-4 shrink-0" />
            Aktivite
          </Link>

          {/* Takvim */}
          <Link
            href="/calendar"
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive('/calendar')
                ? 'bg-sidebar-primary/15 text-sidebar-primary'
                : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
            )}
          >
            <CalendarDays className="w-4 h-4 shrink-0" />
            Takvim
          </Link>

          {/* Kullanıcılar — admin only */}
          {isAdmin && (
            <Link
              href="/users"
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive('/users')
                  ? 'bg-sidebar-primary/15 text-sidebar-primary'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
              )}
            >
              <Settings className="w-4 h-4 shrink-0" />
              Kullanıcılar
            </Link>
          )}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sidebar-primary/20 text-sidebar-primary text-xs font-semibold">
              {profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">
                {profile?.full_name ?? 'Kullanıcı'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {profile?.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}
              </p>
            </div>
            <button
              onClick={signOut}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Çıkış Yap"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
