'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { MessageSquare, Loader2 } from 'lucide-react'

const ACTIVITY_LINK = 'https://dash.e4labs.com.tr/activity'

export function SmsTestCard() {
  const [phone, setPhone] = useState('')
  const [loadingType, setLoadingType] = useState<'invoice' | 'activity' | null>(null)

  const sendTest = async (type: 'invoice' | 'activity') => {
    if (!phone) {
      toast.error('Lütfen test için bir numara girin')
      return
    }

    setLoadingType(type)
    const message =
      type === 'invoice'
        ? 'Sayın Test Kullanıcısı faturanız oluşturulmuştur. Teşekkür ederiz.'
        : `Aktiviteniz eksik, lutfen tamamlayin. ${ACTIVITY_LINK}`

    try {
      const res = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'SMS gönderilemedi')

      toast.success('SMS test mesajı başarıyla gönderildi!', {
        description: data.jobId ? `Job ID: ${data.jobId}` : undefined,
      })
      setPhone('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gönderim hatası')
    } finally {
      setLoadingType(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          SMS Entegrasyon Testi
        </CardTitle>
        <CardDescription>
          NetGSM hesabı ve ayarlarının doğru çalışıp çalışmadığını test etmek için kendi numaranıza mesaj gönderin.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Örn: 0555 555 5555"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={() => sendTest('invoice')} disabled={loadingType !== null || !phone} className="bg-blue-600 hover:bg-blue-700 text-white">
          {loadingType === 'invoice' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageSquare className="w-4 h-4 mr-2" />}
          {loadingType === 'invoice' ? 'Gönderiliyor...' : 'Fatura Testi'}
        </Button>
        <Button onClick={() => sendTest('activity')} disabled={loadingType !== null || !phone} variant="outline">
          {loadingType === 'activity' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageSquare className="w-4 h-4 mr-2" />}
          {loadingType === 'activity' ? 'Gönderiliyor...' : 'Aktivite Testi'}
        </Button>
      </CardContent>
    </Card>
  )
}
