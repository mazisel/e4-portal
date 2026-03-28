'use client'

import { useState } from 'react'
import { useDebts } from '@/hooks/useDebts'
import { Debt, DebtType, DebtStatus, DEBT_TYPE_LABELS } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Plus, Pencil, Trash2, Check } from 'lucide-react'

const EMPTY: Omit<Debt, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  type: 'payable',
  contact_name: '',
  amount: 0,
  description: null,
  due_date: null,
  status: 'pending',
  notes: null,
}

const STATUS_LABELS: Record<DebtStatus, string> = {
  pending: 'Ödenmedi',
  paid: 'Ödendi',
}

export default function DebtsPage() {
  const { debts, loading, createDebt, updateDebt, deleteDebt } = useDebts()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Debt | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const openNew = (type: DebtType = 'payable') => {
    setEditing(null); setForm({ ...EMPTY, type }); setOpen(true)
  }
  const openEdit = (d: Debt) => {
    setEditing(d)
    setForm({ type: d.type, contact_name: d.contact_name, amount: d.amount, description: d.description, due_date: d.due_date, status: d.status, notes: d.notes })
    setOpen(true)
  }

  const handleSave = async () => {
    if (!form.contact_name || form.amount <= 0) return
    setSaving(true)
    const ok = editing ? await updateDebt(editing.id, form) : await createDebt(form)
    setSaving(false)
    if (ok) setOpen(false)
  }

  const fmt = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2 })

  const payable = debts.filter(d => d.type === 'payable')
  const receivable = debts.filter(d => d.type === 'receivable')
  const pendingPayable = payable.filter(d => d.status === 'pending').reduce((s, d) => s + d.amount, 0)
  const pendingReceivable = receivable.filter(d => d.status === 'pending').reduce((s, d) => s + d.amount, 0)

  const DebtList = ({ items }: { items: Debt[] }) => (
    <div className="space-y-2">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Kayıt yok</p>
      ) : items.map(d => (
        <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium truncate">{d.contact_name}</p>
              <Badge variant={d.status === 'paid' ? 'secondary' : 'destructive'} className="text-xs">
                {STATUS_LABELS[d.status]}
              </Badge>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
              {d.description && <span className="truncate">{d.description}</span>}
              {d.due_date && <span>Vade: {new Date(d.due_date).toLocaleDateString('tr-TR')}</span>}
            </div>
          </div>
          <span className="text-sm font-semibold shrink-0">₺{fmt(d.amount)}</span>
          <div className="flex gap-1 shrink-0">
            {d.status === 'pending' && (
              <Button size="icon" variant="ghost" className="w-8 h-8 text-emerald-600" title="Ödendi olarak işaretle"
                onClick={() => updateDebt(d.id, { status: 'paid' })}>
                <Check className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => openEdit(d)}><Pencil className="w-3.5 h-3.5" /></Button>
            <Button size="icon" variant="ghost" className="w-8 h-8 text-destructive hover:text-destructive" onClick={() => deleteDebt(d.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Borçlar</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openNew('receivable')} className="gap-2"><Plus className="w-4 h-4" />Alacak Ekle</Button>
          <Button onClick={() => openNew('payable')} className="gap-2"><Plus className="w-4 h-4" />Borç Ekle</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Toplam Borcumuz</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-destructive">₺{fmt(pendingPayable)}</p><p className="text-xs text-muted-foreground mt-1">Ödenmemiş</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Toplam Alacağımız</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-emerald-600">₺{fmt(pendingReceivable)}</p><p className="text-xs text-muted-foreground mt-1">Tahsil edilmemiş</p></CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : (
        <Tabs defaultValue="payable">
          <TabsList>
            <TabsTrigger value="payable">Borçlarımız ({payable.length})</TabsTrigger>
            <TabsTrigger value="receivable">Alacaklarımız ({receivable.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="payable" className="mt-4"><DebtList items={payable} /></TabsContent>
          <TabsContent value="receivable" className="mt-4"><DebtList items={receivable} /></TabsContent>
        </Tabs>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Kaydı Düzenle' : `Yeni ${DEBT_TYPE_LABELS[form.type]}`}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {!editing && (
              <div className="grid grid-cols-2 gap-3">
                <button className={`p-3 rounded-lg border text-sm font-medium transition-colors ${form.type === 'payable' ? 'bg-red-100 border-red-400 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'hover:bg-muted'}`}
                  onClick={() => setForm(f => ({ ...f, type: 'payable' as DebtType }))}>Borcumuz</button>
                <button className={`p-3 rounded-lg border text-sm font-medium transition-colors ${form.type === 'receivable' ? 'bg-emerald-100 border-emerald-400 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'hover:bg-muted'}`}
                  onClick={() => setForm(f => ({ ...f, type: 'receivable' as DebtType }))}>Alacağımız</button>
              </div>
            )}
            <div className="space-y-1">
              <Label>Kişi / Firma *</Label>
              <Input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="Ad veya firma adı" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tutar (₺) *</Label>
                <Input type="number" min="0" step="0.01" value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-1">
                <Label>Vade Tarihi</Label>
                <Input type="date" value={form.due_date ?? ''} onChange={e => setForm(f => ({ ...f, due_date: e.target.value || null }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Açıklama</Label>
              <Input value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value || null }))} />
            </div>
            {editing && (
              <div className="space-y-1">
                <Label>Durum</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as DebtStatus }))}
                >
                  <option value="pending">Ödenmedi</option>
                  <option value="paid">Ödendi</option>
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
            <Button onClick={handleSave} disabled={saving || !form.contact_name || form.amount <= 0}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
