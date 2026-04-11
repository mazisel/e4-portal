'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { MessageCircle, Loader2 } from 'lucide-react'

export function WhatsappTestCard() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const handleTest = async () => {
    if (!phone) {
      toast.error('Lütfen test için bir numara girin')
      return
    }

    setLoading(true)
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
      setLoading(false)
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
          Twilio hesabı ve `.env` değişkenlerinin doğru ayarlanıp ayarlanmadığını test etmek için kendi numaranıza (başında sıfır ile veya sıfırsız) mesaj gönderin. Sandbox kullanıyorsanız numarayı önce Sandbox'a `join ...` koduyla kaydetmeniz gerekebilir.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-3">
        <Input 
          placeholder="Örn: 0555 555 5555" 
          value={phone} 
          onChange={e => setPhone(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={handleTest} disabled={loading || !phone} className="bg-green-600 hover:bg-green-700 text-white">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageCircle className="w-4 h-4 mr-2" />}
          {loading ? 'Gönderiliyor...' : 'Test Et'}
        </Button>
      </CardContent>
    </Card>
  )
}
