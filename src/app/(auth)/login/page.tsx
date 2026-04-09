'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await signIn(email, password)
    if (error) setError(error)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sidebar-primary/20 via-background to-background" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary/20">
                <span className="text-lg font-bold text-sidebar-primary">e4</span>
              </div>
              <span className="text-lg font-semibold text-foreground">e4 Portal</span>
            </div>
          </div>

          <div className="space-y-4 max-w-md">
            <h1 className="text-3xl font-bold leading-tight text-foreground">
              İş süreçlerinizi
              <br />
              <span className="text-sidebar-primary">tek yerden</span> yönetin.
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Finans, aktivite takibi ve takvim planlama araçlarıyla ekibinizi organize edin.
            </p>
          </div>

          <p className="text-xs text-muted-foreground/50">
            © 2026 e4 Labs. Tüm hakları saklıdır.
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute -right-20 top-1/4 h-64 w-64 rounded-full bg-sidebar-primary/5 blur-3xl" />
        <div className="absolute -right-10 bottom-1/4 h-48 w-48 rounded-full bg-sidebar-primary/8 blur-2xl" />
      </div>

      {/* Right — Login Form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-sidebar-primary/20">
              <span className="text-xl font-bold text-sidebar-primary">e4</span>
            </div>
            <h2 className="text-lg font-semibold">e4 Portal</h2>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-bold">Giriş Yap</h2>
            <p className="text-sm text-muted-foreground">Hesabınıza giriş yaparak devam edin</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <span className="shrink-0 mt-0.5">!</span>
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full h-11 gap-2" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Giriş yapılıyor...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Giriş Yap
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground/50 lg:hidden">
            © 2026 e4 Labs
          </p>
        </div>
      </div>
    </div>
  )
}
