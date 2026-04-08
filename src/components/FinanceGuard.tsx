'use client'

import { useAuth } from '@/contexts/AuthContext'
import { AlertTriangle, Loader2, Lock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function FinanceGuard({ children }: { children: React.ReactNode }) {
  const { profile, loading, error } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Sayfa hazırlanıyor</h2>
            <p className="text-sm text-muted-foreground">
              Oturum ve erişim bilgileri doğrulanıyor.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full py-24 text-center gap-4">
        <div className="rounded-full bg-muted p-5">
          <AlertTriangle className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Sayfa açılamadı</h2>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
        <Button type="button" variant="outline" onClick={() => window.location.reload()}>
          Tekrar Dene
        </Button>
      </div>
    )
  }

  if (!profile?.can_access_finance) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full py-24 text-center gap-4">
        <div className="rounded-full bg-muted p-5">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Erişim Yetkisi Yok</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Bu sayfayı görüntülemek için finans erişim yetkiniz bulunmamaktadır.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/home">Ana Sayfaya Dön</Link>
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
