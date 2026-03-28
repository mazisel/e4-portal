'use client'

import { useState } from 'react'
import { useAdvances } from '@/hooks/useAdvances'
import { useStaff } from '@/hooks/useStaff'
import { Advance, AdvanceStatus, ADVANCE_STATUS_LABELS } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Plus, Pencil, Trash2, User } from 'lucide-react'

const EMPTY: Omit<Advance, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  staff_id: null,
  person_name: '',
  amount: 0,
  description: null,
  advance_date: new Date().toISOString().split('T')[0],
  status: 'pending',
  notes: null,
}

const STATUS_COLORS: Record<AdvanceStatus, string> = {
  pending: 'destructive',
  returned: 'secondary',
  deducted: 'secondary',
}

export default function AdvancesPage() {
  const { advances, loading, createAdvance, updateAdvance, deleteAdvance } = useAdvances()
  const { staff } = useStaff(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Advance | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const openNew = () => { setEditing(null); setForm(EMPTY); setOpen(true) }
  const openEdit = (a: Advance) => {
    setEditing(a)
    setForm({ staff_id: a.staff_id, person_name: a.person_name, amount: a.amount, description: a.description, advance_date: a.advance_date, status: a.status, notes: a.notes })
    setOpen(true)
  }

  const handleStaffChange = (staffId: string) => {
    const s = staff.find(s => s.id === staffId)
    setForm(f => ({ ...f, staff_id: staffId || null, person_name: s?.name ?? f.person_name }))
  }

  const handleSave = async () => {
    if (!form.person_name || form.amount <= 0) return
    setSaving(true)
    const ok = editing ? await updateAdvance(editing.id, form) : await createAdvance(form)
    setSaving(false)
    if (ok) setOpen(false)
  }

  const fmt = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2 })

  const totalPending = advances.filter(a => a.status === 'pending').reduce((s, a) => s + a.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Avanslar</h1>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />Yeni Avans</Button>
      </div>

      <Card className="w-fit">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Bekleyen Toplam Avans</CardTitle></CardHeader>
        <CardContent><p className="text-2xl font-bold text-destructive">₺{fmt(totalPending)}</p></CardContent>
      </Card>

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : advances.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">Henüz avans kaydı yok</p>
      ) : (
        <div className="space-y-2">
          {advances.map(a => (
            <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium truncate">{a.person_name}</p>
                  <Badge variant={STATUS_COLORS[a.status] as 'destructive' | 'secondary'} className="text-xs">
                    {ADVANCE_STATUS_LABELS[a.status]}
                  </Badge>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                  <span>{new Date(a.advance_date).toLocaleDateString('tr-TR')}</span>
                  {a.description && <span className="truncate">{a.description}</span>}
                </div>
              </div>
              <span className="text-sm font-semibold shrink-0">₺{fmt(a.amount)}</span>
              <div className="flex gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => openEdit(a)}><Pencil className="w-3.5 h-3.5" /></Button>
                <Button size="icon" variant="ghost" className="w-8 h-8 text-destructive hover:text-destructive" onClick={() => deleteAdvance(a.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Avansı Düzenle' : 'Yeni Avans'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Personel (opsiyonel)</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.staff_id ?? ''}
                onChange={e => handleStaffChange(e.target.value)}
              >
                <option value="">— Personel seçin veya elle girin —</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Kişi Adı *</Label>
              <Input value={form.person_name} onChange={e => setForm(f => ({ ...f, person_name: e.target.value }))} placeholder="Ad Soyad" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tutar (₺) *</Label>
                <Input type="number" min="0" step="0.01" value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-1">
                <Label>Tarih</Label>
                <Input type="date" value={form.advance_date} onChange={e => setForm(f => ({ ...f, advance_date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Açıklama</Label>
              <Input value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value || null }))} />
            </div>
            <div className="space-y-1">
              <Label>Durum</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as AdvanceStatus }))}
              >
                <option value="pending">Bekliyor</option>
                <option value="returned">Geri Ödendi</option>
                <option value="deducted">Maaştan Kesildi</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
            <Button onClick={handleSave} disabled={saving || !form.person_name || form.amount <= 0}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
