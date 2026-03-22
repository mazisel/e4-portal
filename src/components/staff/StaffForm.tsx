'use client'

import { useState, useEffect } from 'react'
import { Staff } from '@/types'
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

type FormValues = Omit<Staff, 'id' | 'user_id' | 'created_at' | 'updated_at'>

interface StaffFormProps {
  open: boolean
  onClose: () => void
  onSave: (values: FormValues) => Promise<boolean>
  initial?: Staff | null
}

export function StaffForm({ open, onClose, onSave, initial }: StaffFormProps) {
  const [name, setName] = useState('')
  const [position, setPosition] = useState('')
  const [monthlySalary, setMonthlySalary] = useState('')
  const [notes, setNotes] = useState('')
  const [active, setActive] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initial) {
      setName(initial.name)
      setPosition(initial.position || '')
      setMonthlySalary(initial.monthly_salary != null ? String(initial.monthly_salary) : '')
      setNotes(initial.notes || '')
      setActive(initial.active)
    } else {
      setName('')
      setPosition('')
      setMonthlySalary('')
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
      position: position.trim() || null,
      monthly_salary: monthlySalary ? parseFloat(monthlySalary) : null,
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
          <DialogTitle>{initial ? 'Personel Düzenle' : 'Yeni Personel'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Ad Soyad *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ahmet Yılmaz"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pozisyon</Label>
              <Input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Şef, Garson..."
              />
            </div>
            <div className="space-y-2">
              <Label>Aylık Maaş (₺)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(e.target.value)}
                placeholder="0.00"
              />
            </div>
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
              <Label htmlFor="active">Aktif personel</Label>
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
