'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ArrowLeftRight, Tag, BarChart3,
  Users, Building2, SlidersHorizontal, Truck, X, ChevronLeft,
  Wallet, CreditCard, HandCoins,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
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

interface FinanceSidebarProps {
  open: boolean
  onClose: () => void
}

export function FinanceSidebar({ open, onClose }: FinanceSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r flex flex-col transition-transform duration-200',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b">
          <div>
            <p className="font-semibold text-sm">e4 Labs</p>
            <p className="text-xs text-muted-foreground">Finans</p>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <Link
            href="/home"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Ana Sayfa
          </Link>
          <div className="my-2 border-t" />
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            © 2026 e4 Labs. Tüm hakları saklıdır.
          </p>
        </div>
      </aside>
    </>
  )
}
