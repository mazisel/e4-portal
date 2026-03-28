'use client'

import { useState } from 'react'
import { useKasa } from '@/hooks/useKasa'
import { KasaEntry, KasaEntryType } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, Wallet } from 'lucide-react'

const EMPTY: Omit<KasaEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  type: 'in',
  amount: 0,
  description: '',
  entry_date: new Date().toISOString().split('T')[0],
  notes: null,
}

export default function KasaPage() {
  const { entries, loading, balance, createEntry, updateEntry, deleteEntry } = useKasa()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<KasaEntry | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const openNew = () => { setEditing(null); setForm(EMPTY); setOpen(true) }
  const openEdit = (e: KasaEntry) => {
    setEditing(e)
    setForm({ type: e.type, amount: e.amount, description: e.description, entry_date: e.entry_date, notes: e.notes })
    setOpen(true)
  }

  const handleSave = async () => {
    if (!form.description || form.amount <= 0) return
    setSaving(true)
    const ok = editing
      ? await updateEntry(editing.id, form)
      : await createEntry(form)
    setSaving(false)
    if (ok) setOpen(false)
  }

  const totalIn = entries.filter(e => e.type === 'in').reduce((s, e) => s + e.amount, 0)
  const totalOut = entries.filter(e => e.type === 'out').reduce((s, e) => s + e.amount, 0)

  const fmt = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2 })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kasa</h1>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />Yeni Kayıt</Button>
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Wallet className="w-4 h-4" />Mevcut Bakiye</CardTitle></CardHeader>
          <CardContent><p className={`text-2xl font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>₺{fmt(balance)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" />Toplam Giriş</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-emerald-600">₺{fmt(totalIn)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><TrendingDown className="w-4 h-4 text-destructive" />Toplam Çıkış</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-destructive">₺{fmt(totalOut)}</p></CardContent>
        </Card>
      </div>

      {/* Liste */}
      <Card>
        <CardHeader><CardTitle className="text-base">İşlem Geçmişi</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Henüz kasa kaydı yok</p>
          ) : (
            <div className="space-y-2">
              {entries.map(e => (
                <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${e.type === 'in' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                    {e.type === 'in'
                      ? <TrendingUp className="w-4 h-4 text-emerald-600" />
                      : <TrendingDown className="w-4 h-4 text-destructive" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{e.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(e.entry_date).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <span className={`text-sm font-semibold ${e.type === 'in' ? 'text-emerald-600' : 'text-destructive'}`}>
                    {e.type === 'in' ? '+' : '-'}₺{fmt(e.amount)}
                  </span>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => openEdit(e)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="w-8 h-8 text-destructive hover:text-destructive" onClick={() => deleteEntry(e.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Kaydı Düzenle' : 'Yeni Kasa Kaydı'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${form.type === 'in' ? 'bg-emerald-100 border-emerald-400 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'hover:bg-muted'}`}
                onClick={() => setForm(f => ({ ...f, type: 'in' as KasaEntryType }))}
              >Nakit Giriş</button>
              <button
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${form.type === 'out' ? 'bg-red-100 border-red-400 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'hover:bg-muted'}`}
                onClick={() => setForm(f => ({ ...f, type: 'out' as KasaEntryType }))}
              >Nakit Çıkış</button>
            </div>
            <div className="space-y-1">
              <Label>Açıklama *</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ne için?" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tutar (₺) *</Label>
                <Input type="number" min="0" step="0.01" value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-1">
                <Label>Tarih</Label>
                <Input type="date" value={form.entry_date} onChange={e => setForm(f => ({ ...f, entry_date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notlar</Label>
              <Input value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value || null }))} placeholder="Opsiyonel" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
            <Button onClick={handleSave} disabled={saving || !form.description || form.amount <= 0}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
