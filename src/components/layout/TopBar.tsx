'use client'

import { useState, useEffect } from 'react'
import { Menu, Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

interface TopBarProps {
  onMenuClick?: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const nextTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark'
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor

  return (
    <header className="h-12 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 gap-4 shrink-0">
      <div className="flex items-center gap-2">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md hover:bg-muted"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1" />

      {mounted && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(nextTheme)}
          title={`Tema: ${theme} → ${nextTheme}`}
        >
          <ThemeIcon className="w-4 h-4" />
        </Button>
      )}
    </header>
  )
}
