'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, LogOut, User, Sun, Moon, Monitor, ChevronLeft } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/AuthContext'

interface TopBarProps {
  onMenuClick?: () => void
  backHref?: string
}

export function TopBar({ onMenuClick, backHref }: TopBarProps) {
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const nextTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark'
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4 gap-4 shrink-0">
      <div className="flex items-center gap-2">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md hover:bg-muted"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        {backHref && (
          <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground">
            <Link href={backHref}>
              <ChevronLeft className="w-4 h-4" />
              Ana Sayfa
            </Link>
          </Button>
        )}
      </div>

      <div className="flex-1" />

      {mounted && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(nextTheme)}
          title={`Tema: ${theme} → ${nextTheme}`}
        >
          <ThemeIcon className="w-4 h-4" />
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">{user?.email}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
            <LogOut className="w-4 h-4 mr-2" />
            Çıkış Yap
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
