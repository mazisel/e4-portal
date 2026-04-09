'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ArrowLeftRight, Tag, BarChart3,
  Users, Building2, SlidersHorizontal, Truck, X,
  Wallet, CreditCard, HandCoins, CalendarDays,
  ClipboardList, Settings, LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

interface NavItem {
  href: string
  label: string
  icon: typeof LayoutDashboard
  adminOnly?: boolean
  financeOnly?: boolean
}

const mainNav: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, financeOnly: true },
  { href: '/transactions', label: 'İşlemler', icon: ArrowLeftRight, financeOnly: true },
  { href: '/kasa', label: 'Kasa', icon: Wallet, financeOnly: true },
  { href: '/debts', label: 'Borçlar', icon: CreditCard, financeOnly: true },
  { href: '/advances', label: 'Avanslar', icon: HandCoins, financeOnly: true },
  { href: '/categories', label: 'Kategoriler', icon: Tag, financeOnly: true },
  { href: '/reports', label: 'Raporlar', icon: BarChart3, financeOnly: true },
]

const resourceNav: NavItem[] = [
  { href: '/staff', label: 'Personeller', icon: Users, financeOnly: true },
  { href: '/customers', label: 'Müşteriler', icon: Building2, financeOnly: true },
  { href: '/suppliers', label: 'Tedarikçiler', icon: Truck, financeOnly: true },
  { href: '/fixed', label: 'Sabitler', icon: SlidersHorizontal, financeOnly: true },
]

const toolsNav: NavItem[] = [
  { href: '/calendar', label: 'Takvim', icon: CalendarDays },
  { href: '/activity', label: 'Aktivite', icon: ClipboardList },
]

const adminNav: NavItem[] = [
  { href: '/users', label: 'Kullanıcılar', icon: Settings, adminOnly: true },
]

function NavSection({ label, items, pathname, onClose, canFinance, isAdmin }: {
  label: string
  items: NavItem[]
  pathname: string
  onClose: () => void
  canFinance: boolean
  isAdmin: boolean
}) {
  const filtered = items.filter(item => {
    if (item.adminOnly && !isAdmin) return false
    if (item.financeOnly && !canFinance) return false
    return true
  })

  if (filtered.length === 0) return null

  return (
    <div className="space-y-1">
      <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {label}
      </p>
      {filtered.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-sidebar-primary/15 text-sidebar-primary'
                : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {item.label}
          </Link>
        )
      })}
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
        <nav className="flex-1 px-2 py-1 overflow-y-auto space-y-1">
          {canFinance && (
            <NavSection label="Finans" items={mainNav} pathname={pathname} onClose={onClose} canFinance={canFinance} isAdmin={isAdmin} />
          )}
          {canFinance && (
            <NavSection label="Kayıtlar" items={resourceNav} pathname={pathname} onClose={onClose} canFinance={canFinance} isAdmin={isAdmin} />
          )}
          <NavSection label="Araçlar" items={toolsNav} pathname={pathname} onClose={onClose} canFinance={canFinance} isAdmin={isAdmin} />
          <NavSection label="Yönetim" items={adminNav} pathname={pathname} onClose={onClose} canFinance={canFinance} isAdmin={isAdmin} />
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
