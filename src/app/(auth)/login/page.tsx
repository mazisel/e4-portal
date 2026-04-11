'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react'

// ——— Owl Mascot ———

type OwlState = 'idle' | 'watching' | 'hiding' | 'peeking' | 'success' | 'error'

function OwlMascot({ state, lookAt }: { state: OwlState; lookAt: number }) {
  const px = state === 'hiding' || state === 'peeking' ? 0 : lookAt * 5
  const py = state === 'watching' ? 3 : 0
  const pr = state === 'peeking' ? 4 : 8

  // Göz kapanma animasyonu
  const eyeScaleY =
    state === 'hiding'  ? 0.05 :
    state === 'peeking' ? 0.80 :
    state === 'success' ? 0    : 1

  // Kolların gelip gözleri kapadığı animasyon
  const armsVisible = state === 'hiding' || state === 'peeking'
  const leftTX  = armsVisible ? 0 : -130
  const rightTX = armsVisible ? 0 :  130
  const armTY   = state === 'peeking' ? 28 : 0

  const tr = (tx: number) =>
    `translateX(${tx}px) translateY(${armTY}px)`

  return (
    <div className="flex justify-center mb-4">
      {/* 140x140 boyutunda ortalanmış baykuş SVG'si */}
      <svg width="140" height="140" viewBox="0 0 180 180" className="select-none" style={{ overflow: 'hidden', borderRadius: '16px' }}>

        {/* --- Arka Kanatlar (Dinlenme Hali) --- */}
        <path d="M 35 80 C 15 90 15 140 45 150 C 35 130 35 100 40 80 Z" className="fill-slate-800" />
        <path d="M 145 80 C 165 90 165 140 135 150 C 145 130 145 100 140 80 Z" className="fill-slate-800" />

        {/* --- Kulaklar --- */}
        <path d="M40 70 L25 15 L75 50 Z" className="fill-slate-700" strokeLinejoin="round" />
        <path d="M140 70 L155 15 L105 50 Z" className="fill-slate-700" strokeLinejoin="round" />

        {/* --- Gövde (Ana Kapsül) --- */}
        <rect x="35" y="40" width="110" height="130" rx="55" className="fill-slate-700" />
        
        {/* --- Göbek --- */}
        <path d="M 50 110 Q 90 80 130 110 L 130 140 Q 130 160 90 160 Q 50 160 50 140 Z" className="fill-slate-600" />

        {/* --- Sol Göz --- */}
        <g style={{
          transformBox: 'fill-box', transformOrigin: 'center',
          transform: `scaleY(${eyeScaleY})`,
          transition: 'transform 0.3s ease-out',
        }}>
          {/* Göz Akı */}
          <circle cx="68" cy="75" r="22" className="fill-white" />
          {/* Göz Bebeği (Hareketli) */}
          <g style={{ transform: `translate(${px}px, ${py}px)`, transition: 'transform 0.1s ease-out' }}>
            <circle cx="68" cy="75" r="11" className="fill-slate-900" />
            <circle cx={68 + px ? 65 : 65} cy={px ? 72 : 72} r="3" className="fill-white" />
          </g>
        </g>

        {/* --- Sağ Göz --- */}
        <g style={{
          transformBox: 'fill-box', transformOrigin: 'center',
          transform: `scaleY(${eyeScaleY})`,
          transition: 'transform 0.3s ease-out',
        }}>
          {/* Göz Akı */}
          <circle cx="112" cy="75" r="22" className="fill-white" />
          {/* Göz Bebeği (Hareketli) */}
          <g style={{ transform: `translate(${px}px, ${py}px)`, transition: 'transform 0.1s ease-out' }}>
            <circle cx="112" cy="75" r="11" className="fill-slate-900" />
            <circle cx={px ? 109 : 109} cy={px ? 72 : 72} r="3" className="fill-white" />
          </g>
        </g>

        {/* --- Başarı / Hata Göz İfadeleri --- */}
        {state === 'success' && (
          <>
            <path d="M 50 75 Q 68 60 86 75" className="stroke-emerald-400 fill-none" strokeWidth="4" strokeLinecap="round" />
            <path d="M 94 75 Q 112 60 130 75" className="stroke-emerald-400 fill-none" strokeWidth="4" strokeLinecap="round" />
          </>
        )}

        {state === 'error' && (
          <>
            <path d="M 56 65 L 80 85 M 80 65 L 56 85" className="stroke-rose-500 fill-none" strokeWidth="4" strokeLinecap="round" />
            <path d="M 100 65 L 124 85 M 124 65 L 100 85" className="stroke-rose-500 fill-none" strokeWidth="4" strokeLinecap="round" />
          </>
        )}

        {/* --- Gaga --- */}
        <path d="M 83 91 L 97 91 L 90 104 Z" className="fill-amber-500" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" />

        {/* --- Yanak Allıkları --- */}
        <ellipse cx="45" cy="90" rx="8" ry="4" className="fill-rose-400/30" />
        <ellipse cx="135" cy="90" rx="8" ry="4" className="fill-rose-400/30" />

        {/* --- Sol Kol (Göz Kapatan Kol) --- */}
        <g style={{ transform: tr(leftTX), transition: 'transform 0.38s cubic-bezier(0.34,1.56,0.64,1)' }}>
           {/* Kol gövdesi */}
           <ellipse cx="68" cy="75" rx="30" ry="26" className="fill-slate-600" />
           {/* Parmak / Tüy detayları */}
           <circle cx="88" cy="65" r="8" className="fill-slate-500" />
           <circle cx="95" cy="75" r="8" className="fill-slate-500" />
           <circle cx="88" cy="85" r="8" className="fill-slate-500" />
        </g>

        {/* --- Sağ Kol (Göz Kapatan Kol) --- */}
        <g style={{ transform: tr(rightTX), transition: 'transform 0.38s cubic-bezier(0.34,1.56,0.64,1)' }}>
           {/* Kol gövdesi */}
           <ellipse cx="112" cy="75" rx="30" ry="26" className="fill-slate-600" />
           {/* Parmak / Tüy detayları */}
           <circle cx="92" cy="65" r="8" className="fill-slate-500" />
           <circle cx="85" cy="75" r="8" className="fill-slate-500" />
           <circle cx="92" cy="85" r="8" className="fill-slate-500" />
        </g>

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
              <Image src="/e4_labs_logo.png" alt="e4 Labs Logo" width={40} height={40} className="rounded-xl object-contain" />
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
          <div className="lg:hidden flex flex-col items-center justify-center space-y-3">
            <Image src="/e4_labs_logo.png" alt="e4 Labs Logo" width={56} height={56} className="rounded-xl object-contain drop-shadow" />
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
                  onMouseDown={(e) => e.preventDefault()}
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
