'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react'

// ——— Owl Mascot ———

type OwlState = 'idle' | 'watching' | 'hiding' | 'peeking' | 'success' | 'error'

function OwlMascot({ state, lookAt }: { state: OwlState; lookAt: number }) {
  // lookAt: -1 (left) to 1 (right), controls pupil position
  const pupilX = state === 'hiding' ? 0 : lookAt * 3
  const pupilY = state === 'watching' ? 2 : 0

  return (
    <div className="flex justify-center mb-2">
      <svg width="120" height="100" viewBox="0 0 120 100" className="select-none">
        {/* Body */}
        <ellipse cx="60" cy="70" rx="35" ry="28" className="fill-sidebar-primary/20" />

        {/* Ears/horns */}
        <path d="M32 45 L25 25 L42 40 Z" className="fill-sidebar-primary/30" />
        <path d="M88 45 L95 25 L78 40 Z" className="fill-sidebar-primary/30" />

        {/* Head */}
        <ellipse cx="60" cy="48" rx="30" ry="24" className="fill-sidebar-primary/25" />

        {/* Eye whites */}
        <ellipse cx="46" cy="46" rx="12" ry="11" className="fill-foreground/90">
          <animate
            attributeName="ry"
            values={state === 'hiding' ? '11;1' : state === 'peeking' ? '1;5' : '11'}
            dur={state === 'hiding' || state === 'peeking' ? '0.3s' : '0.01s'}
            fill="freeze"
          />
        </ellipse>
        <ellipse cx="74" cy="46" rx="12" ry="11" className="fill-foreground/90">
          <animate
            attributeName="ry"
            values={state === 'hiding' ? '11;1' : state === 'peeking' ? '1;5' : '11'}
            dur={state === 'hiding' || state === 'peeking' ? '0.3s' : '0.01s'}
            fill="freeze"
          />
        </ellipse>

        {/* Pupils */}
        {state !== 'hiding' && (
          <>
            <circle cx={46 + pupilX} cy={46 + pupilY} r={state === 'peeking' ? 2.5 : 5} className="fill-background">
              <animate
                attributeName="r"
                values={state === 'error' ? '5;7;5' : state === 'success' ? '5;3;5' : String(state === 'peeking' ? 2.5 : 5)}
                dur={state === 'error' || state === 'success' ? '0.3s' : '0.01s'}
                fill="freeze"
              />
            </circle>
            <circle cx={74 + pupilX} cy={46 + pupilY} r={state === 'peeking' ? 2.5 : 5} className="fill-background">
              <animate
                attributeName="r"
                values={state === 'error' ? '5;7;5' : state === 'success' ? '5;3;5' : String(state === 'peeking' ? 2.5 : 5)}
                dur={state === 'error' || state === 'success' ? '0.3s' : '0.01s'}
                fill="freeze"
              />
            </circle>
            {/* Eye shine */}
            <circle cx={44 + pupilX} cy={44 + pupilY} r={state === 'peeking' ? 0.8 : 1.5} className="fill-foreground/80" />
            <circle cx={72 + pupilX} cy={44 + pupilY} r={state === 'peeking' ? 0.8 : 1.5} className="fill-foreground/80" />
          </>
        )}

        {/* Hands covering eyes when hiding */}
        {state === 'hiding' && (
          <>
            <ellipse cx="46" cy="46" rx="14" ry="10" className="fill-sidebar-primary/30">
              <animate attributeName="cy" values="65;46" dur="0.3s" fill="freeze" />
            </ellipse>
            <ellipse cx="74" cy="46" rx="14" ry="10" className="fill-sidebar-primary/30">
              <animate attributeName="cy" values="65;46" dur="0.3s" fill="freeze" />
            </ellipse>
          </>
        )}

        {/* Beak */}
        <path d="M56 54 L60 60 L64 54 Z" className="fill-amber-500/80" />

        {/* Blush */}
        <ellipse cx="36" cy="55" rx="5" ry="3" className="fill-pink-400/20" />
        <ellipse cx="84" cy="55" rx="5" ry="3" className="fill-pink-400/20" />

        {/* Feet */}
        <ellipse cx="48" cy="95" rx="8" ry="3" className="fill-amber-500/40" />
        <ellipse cx="72" cy="95" rx="8" ry="3" className="fill-amber-500/40" />

        {/* Error state: eyebrows angry */}
        {state === 'error' && (
          <>
            <line x1="36" y1="34" x2="52" y2="37" className="stroke-destructive" strokeWidth="2" strokeLinecap="round">
              <animate attributeName="y1" values="37;34" dur="0.2s" fill="freeze" />
            </line>
            <line x1="84" y1="34" x2="68" y2="37" className="stroke-destructive" strokeWidth="2" strokeLinecap="round">
              <animate attributeName="y1" values="37;34" dur="0.2s" fill="freeze" />
            </line>
          </>
        )}

        {/* Success state: happy eyebrows */}
        {state === 'success' && (
          <>
            <path d="M36 36 Q44 32 52 36" className="stroke-emerald-400 fill-none" strokeWidth="2" strokeLinecap="round">
              <animate attributeName="d" values="M36 38 Q44 38 52 38;M36 36 Q44 32 52 36" dur="0.3s" fill="freeze" />
            </path>
            <path d="M68 36 Q76 32 84 36" className="stroke-emerald-400 fill-none" strokeWidth="2" strokeLinecap="round">
              <animate attributeName="d" values="M68 38 Q76 38 84 38;M68 36 Q76 32 84 36" dur="0.3s" fill="freeze" />
            </path>
          </>
        )}
      </svg>
    </div>
  )
}

// ——— Main Page ———

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null)
  const [owlState, setOwlState] = useState<OwlState>('idle')
  const { signIn } = useAuth()

  // Calculate where owl should look based on email length
  const emailLookAt = Math.min(Math.max((email.length - 10) / 15, -1), 1)

  const currentOwlState: OwlState = (() => {
    if (owlState === 'error' || owlState === 'success') return owlState
    if (focusedField === 'password') {
      return showPassword ? 'peeking' : 'hiding'
    }
    if (focusedField === 'email') return 'watching'
    return 'idle'
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setOwlState('idle')
    const { error } = await signIn(email, password)
    if (error) {
      setError(error)
      setOwlState('error')
      setTimeout(() => setOwlState('idle'), 1500)
    } else {
      setOwlState('success')
    }
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

        <div className="absolute -right-20 top-1/4 h-64 w-64 rounded-full bg-sidebar-primary/5 blur-3xl" />
        <div className="absolute -right-10 bottom-1/4 h-48 w-48 rounded-full bg-sidebar-primary/8 blur-2xl" />
      </div>

      {/* Right — Login Form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile logo */}
          <div className="lg:hidden text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-sidebar-primary/20">
              <span className="text-xl font-bold text-sidebar-primary">e4</span>
            </div>
            <h2 className="text-lg font-semibold">e4 Portal</h2>
          </div>

          {/* Owl */}
          <OwlMascot state={currentOwlState} lookAt={focusedField === 'email' ? emailLookAt : 0} />

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
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
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
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
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
