'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { MessageSquare, Loader2 } from 'lucide-react'

export function SmsTestCard() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const sendTest = async () => {
    if (!phone) {
      toast.error('Lütfen test için bir numara girin')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          message: 'Sayin Test Kullanicisi faturaniz olusturulmustur. Tesekkur ederiz.',
        }),
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
      setLoading(false)
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
        <Button onClick={sendTest} disabled={loading || !phone} className="bg-blue-600 hover:bg-blue-700 text-white">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageSquare className="w-4 h-4 mr-2" />}
          {loading ? 'Gönderiliyor...' : 'Fatura SMS Testi'}
        </Button>
      </CardContent>
    </Card>
  )
}
