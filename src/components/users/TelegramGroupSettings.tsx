'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.88 13.67l-2.967-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.834.95l-.525-.061z"/>
    </svg>
  )
}

interface TelegramGroupSettingsProps {
  initialChatId: string | null
}

export function TelegramGroupSettings({ initialChatId }: TelegramGroupSettingsProps) {
  const [chatId, setChatId] = useState(initialChatId ?? '')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  const isConnected = Boolean(chatId)

  const handleEdit = () => {
    setDraft(chatId)
    setEditing(true)
  }

  const handleCancel = () => {
    setEditing(false)
    setDraft('')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramGroupChatId: draft.trim() || null }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? 'Kaydedilemedi')
      setChatId(payload.settings.telegram_group_chat_id ?? '')
      setEditing(false)
      toast.success('Telegram grup ayarları güncellendi')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kaydedilemedi'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    try {
      const response = await fetch('/api/settings/telegram-test', { method: 'POST' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error ?? 'Test mesajı gönderilemedi')
      toast.success('Test mesajı gruba gönderildi!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Test mesajı gönderilemedi'
      toast.error(message)
    } finally {
      setTesting(false)
    }
  }

  const handleDisconnect = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramGroupChatId: null }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? 'Kaydedilemedi')
      setChatId('')
      setEditing(false)
      toast.success('Telegram grup bağlantısı kesildi')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kaydedilemedi'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-[#229ED9]/20">
      <CardHeader className="border-b pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <TelegramIcon className="h-4 w-4 text-[#229ED9]" />
          Telegram Grup Bağlantısı
          {isConnected ? (
            <Badge variant="secondary" className="ml-auto text-xs font-normal text-[#229ED9]">
              Bağlı
            </Badge>
          ) : (
            <Badge variant="outline" className="ml-auto text-xs font-normal text-muted-foreground">
              Bağlı Değil
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {editing ? (
          <div className="space-y-3">
            <div className="grid gap-1.5">
              <Label htmlFor="telegram-chat-id">Grup Chat ID</Label>
              <Input
                id="telegram-chat-id"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder="-100xxxxxxxxxx"
                className="font-mono"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Telegram grubunun Chat ID'sini gir. Botu gruba ekleyip{' '}
                <span className="font-mono">/start</span> komutunu göndererek öğrenebilirsin.
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel} disabled={saving}>
                Vazgeç
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div>
              {isConnected ? (
                <p className="font-mono text-sm text-muted-foreground">{chatId}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Henüz bir Telegram grubu bağlanmamış. Bildirimler bu grup üzerinden iletilir.
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              {isConnected && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-[#229ED9] hover:text-[#229ED9]"
                  onClick={handleTest}
                  disabled={testing || saving}
                >
                  {testing ? 'Gönderiliyor...' : 'Test Et'}
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handleEdit} disabled={saving || testing}>
                {isConnected ? 'Düzenle' : 'Bağla'}
              </Button>
              {isConnected && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={handleDisconnect}
                  disabled={saving || testing}
                >
                  Bağlantıyı Kes
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
