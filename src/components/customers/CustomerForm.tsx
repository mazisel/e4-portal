'use client'

import { useState, useEffect } from 'react'
import { Customer } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

type FormValues = Omit<Customer, 'id' | 'user_id' | 'created_at' | 'updated_at'>

interface CustomerFormProps {
  open: boolean
  onClose: () => void
  onSave: (values: FormValues) => Promise<boolean>
  initial?: Customer | null
}

export function CustomerForm({ open, onClose, onSave, initial }: CustomerFormProps) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [active, setActive] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initial) {
      setName(initial.name)
      setContact(initial.contact || '')
      setPhone(initial.phone || '')
      setEmail(initial.email || '')
      setNotes(initial.notes || '')
      setActive(initial.active)
    } else {
      setName('')
      setContact('')
      setPhone('')
      setEmail('')
      setNotes('')
      setActive(true)
    }
  }, [initial, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const ok = await onSave({
      name: name.trim(),
      contact: contact.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      notes: notes.trim() || null,
      active,
    })
    setLoading(false)
    if (ok) onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{initial ? 'Müşteri Düzenle' : 'Yeni Müşteri'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Ad / Firma Adı *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ahmet Yılmaz veya ABC Ltd."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>İletişim Kişisi</Label>
              <Input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Sorumlu kişi..."
              />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0555 000 00 00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>E-posta</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@firma.com"
            />
          </div>

          <div className="space-y-2">
            <Label>Notlar</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ek bilgiler..."
            />
          </div>

          {initial && (
            <div className="flex items-center gap-2">
              <input
                id="active"
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <Label htmlFor="active">Aktif müşteri</Label>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
