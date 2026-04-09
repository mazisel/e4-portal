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

const activityItems: SubItem[] = [
  { href: '/activity', label: 'Günlük Kayıt', icon: ClipboardList },
]

const calendarItems: SubItem[] = [
  { href: '/calendar', label: 'Haftalık Plan', icon: CalendarDays },
]

const financePaths = new Set(financeItems.map(i => i.href))

function NavLink({ href, icon: Icon, label, pathname, onClose, size = 'normal' }: {
  href: string
  icon: typeof LayoutDashboard
  label: string
  pathname: string
  onClose: () => void
  size?: 'normal' | 'small'
}) {
  const active = pathname === href || pathname.startsWith(href + '/')
  const isSmall = size === 'small'

  return (
    <Link
      href={href}
      onClick={onClose}
      className={cn(
        'flex items-center gap-2.5 rounded-md font-medium transition-colors',
        isSmall ? 'px-2.5 py-1.5 text-[13px]' : 'px-3 py-2 text-sm rounded-lg',
        active
          ? 'bg-sidebar-primary/15 text-sidebar-primary'
          : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
      )}
    >
      <Icon className={cn('shrink-0', isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
      {label}
    </Link>
  )
}

function AccordionSection({ icon: Icon, label, items, isOpen, onToggle, isActivePath, pathname, onClose }: {
  icon: typeof LayoutDashboard
  label: string
  items: SubItem[]
  isOpen: boolean
  onToggle: () => void
  isActivePath: boolean
  pathname: string
  onClose: () => void
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className={cn(
          'flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          isActivePath
            ? 'text-sidebar-primary'
            : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
        )}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen && (
        <div className="ml-3 mt-1 space-y-0.5 border-l border-sidebar-border pl-3">
          {items.map((item) => (
            <NavLink key={item.href} href={item.href} icon={item.icon} label={item.label} pathname={pathname} onClose={onClose} size="small" />
          ))}
        </div>
      )}
    </div>
  )
}

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
  const isActivityPath = pathname === '/activity' || pathname.startsWith('/activity/')
  const isCalendarPath = pathname === '/calendar' || pathname.startsWith('/calendar/')

  const [financeOpen, setFinanceOpen] = useState(isFinancePath)
  const [activityOpen, setActivityOpen] = useState(isActivityPath)
  const [calendarOpen, setCalendarOpen] = useState(isCalendarPath)

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

          {/* Dashboard — üst seviye, bağımsız */}
          <NavLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" pathname={pathname} onClose={onClose} />

          {/* Finans — accordion, yetkiye göre */}
          {canFinance && (
            <AccordionSection
              icon={TrendingUp}
              label="Finans"
              items={financeItems}
              isOpen={financeOpen}
              onToggle={() => setFinanceOpen(!financeOpen)}
              isActivePath={isFinancePath}
              pathname={pathname}
              onClose={onClose}
            />
          )}

          {/* Aktivite — accordion */}
          <AccordionSection
            icon={ClipboardList}
            label="Aktivite"
            items={activityItems}
            isOpen={activityOpen}
            onToggle={() => setActivityOpen(!activityOpen)}
            isActivePath={isActivityPath}
            pathname={pathname}
            onClose={onClose}
          />

          {/* Takvim — accordion */}
          <AccordionSection
            icon={CalendarDays}
            label="Takvim"
            items={calendarItems}
            isOpen={calendarOpen}
            onToggle={() => setCalendarOpen(!calendarOpen)}
            isActivePath={isCalendarPath}
            pathname={pathname}
            onClose={onClose}
          />

          {/* Kullanıcılar — admin only */}
          {isAdmin && (
            <NavLink href="/users" icon={Settings} label="Kullanıcılar" pathname={pathname} onClose={onClose} />
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
