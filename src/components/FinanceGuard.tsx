'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Lock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function FinanceGuard({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()

  if (loading) return null

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
