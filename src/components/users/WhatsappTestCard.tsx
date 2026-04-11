'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { MessageCircle, Loader2 } from 'lucide-react'

const ACTIVITY_TEST_LINK = 'https://dash.e4labs.com.tr/activity'

export function WhatsappTestCard() {
  const [phone, setPhone] = useState('')
  const [loadingType, setLoadingType] = useState<'invoice' | 'activity' | null>(null)

  const handleInvoiceTest = async () => {
    if (!phone) {
      toast.error('Lütfen test için bir numara girin')
      return
    }

    setLoadingType('invoice')
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone, 
          message: 'Sayın Test Kullanıcısı faturanız oluşturulmuştur. Teşekkür ederiz.',
          variables: {
            "4": "Test Kullanıcısı",
            "1": "storage/v1/object/public/receipts/test-fatura.pdf"
          }
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Test mesajı gönderilemedi')
      
      toast.success('WhatsApp test mesajı başarıyla gönderildi!', {
        description: `Referans No (SID): ${data.sid}`
      })
      setPhone('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gönderim hatası')
      console.error(err)
    } finally {
      setLoadingType(null)
    }
  }

  const handleActivityTest = async () => {
    if (!phone) {
      toast.error('Lütfen test için bir numara girin')
      return
    }

    setLoadingType('activity')
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          message: `Aktiviteniz eksik, lütfen tamamlayın.\nTest bağlantısı: ${ACTIVITY_TEST_LINK}`,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Aktivite test mesajı gönderilemedi')

      toast.success('Aktivite WhatsApp test mesajı gönderildi!', {
        description: `Referans No (SID): ${data.sid}`
      })
      setPhone('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gönderim hatası')
      console.error(err)
    } finally {
      setLoadingType(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-green-600" />
          WhatsApp Entegrasyon Testi
        </CardTitle>
        <CardDescription>
          Twilio hesabı ve `.env` değişkenlerinin doğru ayarlanıp ayarlanmadığını test etmek için kendi numaranıza (başında sıfır ile veya sıfırsız) mesaj gönderin. Sandbox kullanıyorsanız numarayı önce Sandbox&apos;a `join ...` koduyla kaydetmeniz gerekebilir.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <Input 
          placeholder="Örn: 0555 555 5555" 
          value={phone} 
          onChange={e => setPhone(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={handleInvoiceTest} disabled={loadingType !== null || !phone} className="bg-green-600 hover:bg-green-700 text-white">
          {loadingType === 'invoice' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageCircle className="w-4 h-4 mr-2" />}
          {loadingType === 'invoice' ? 'Gönderiliyor...' : 'Fatura Testi'}
        </Button>
        <Button onClick={handleActivityTest} disabled={loadingType !== null || !phone} variant="outline">
          {loadingType === 'activity' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageCircle className="w-4 h-4 mr-2" />}
          {loadingType === 'activity' ? 'Gönderiliyor...' : 'Aktivite Testi'}
        </Button>
      </CardContent>
    </Card>
  )
}
