'use client'

import { useState, useEffect } from 'react'
import { FixedItem, FixedFrequency, FIXED_FREQUENCY_LABELS, MONTH_LABELS, TransactionType } from '@/types'
import { useCustomers } from '@/hooks/useCustomers'
import { useStaff } from '@/hooks/useStaff'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

type FormValues = Omit<FixedItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>

interface FixedItemFormProps {
  open: boolean
  onClose: () => void
  onSave: (values: FormValues) => Promise<boolean>
  initial?: FixedItem | null
  defaultType?: TransactionType
}

export function FixedItemForm({ open, onClose, onSave, initial, defaultType = 'expense' }: FixedItemFormProps) {
  const [type, setType] = useState<TransactionType>(defaultType)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<FixedFrequency>('monthly')
  const [dueDay, setDueDay] = useState('')
  const [dueMonth, setDueMonth] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [notes, setNotes] = useState('')
  const [active, setActive] = useState(true)
  const [loading, setLoading] = useState(false)

  const { customers } = useCustomers(true)
  const { staff } = useStaff(true)

  useEffect(() => {
    if (initial) {
      setType(initial.type)
      setName(initial.name)
      setAmount(String(initial.amount))
      setFrequency(initial.frequency)
      setDueDay(initial.due_day != null ? String(initial.due_day) : '')
      setDueMonth(initial.due_month != null ? String(initial.due_month) : '')
      setCustomerId(initial.customer_id || '')
      setStaffId(initial.staff_id || '')
      setNotes(initial.notes || '')
      setActive(initial.active)
    } else {
      setType(defaultType)
      setName('')
      setAmount('')
      setFrequency('monthly')
      setDueDay('')
      setDueMonth('')
      setCustomerId('')
      setStaffId('')
      setNotes('')
      setActive(true)
    }
  }, [initial, open])

  useEffect(() => {
    if (!initial) { setCustomerId(''); setStaffId('') }
  }, [type])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !amount) return
    setLoading(true)
    const ok = await onSave({
      type,
      name: name.trim(),
      amount: parseFloat(amount),
      frequency,
      due_day: dueDay ? parseInt(dueDay) : null,
      due_month: frequency === 'yearly' && dueMonth ? parseInt(dueMonth) : null,
      customer_id: type === 'income' && customerId ? customerId : null,
      staff_id: type === 'expense' && staffId ? staffId : null,
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
          <DialogTitle>{initial ? 'Kalem Düzenle' : 'Yeni Sabit Kalem'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={type} onValueChange={(v) => setType(v as TransactionType)}>
            <TabsList className="w-full">
              <TabsTrigger value="income" className="flex-1 data-[state=active]:bg-green-500 data-[state=active]:text-white">
                Gelir
              </TabsTrigger>
              <TabsTrigger value="expense" className="flex-1 data-[state=active]:bg-red-500 data-[state=active]:text-white">
                Gider
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            <Label>Kalem Adı *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'income' ? 'Kira Geliri, Satış...' : 'Kira, Elektrik, Maaş...'}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tutar (₺) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Periyot</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as FixedFrequency)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(FIXED_FREQUENCY_LABELS) as FixedFrequency[]).map((f) => (
                    <SelectItem key={f} value={f}>{FIXED_FREQUENCY_LABELS[f]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {frequency === 'yearly' && (
              <div className="space-y-2">
                <Label>Ay</Label>
                <Select value={dueMonth} onValueChange={setDueMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ay seç..." />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_LABELS.map((m, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className={`space-y-2 ${frequency === 'yearly' ? '' : 'col-span-2'}`}>
              <Label>Ayın Kaçında</Label>
              <Select value={dueDay} onValueChange={setDueDay}>
                <SelectTrigger>
                  <SelectValue placeholder="Gün seç..." />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <SelectItem key={d} value={String(d)}>{d}. gün</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {type === 'expense' && staff.length > 0 && (
            <div className="space-y-2">
              <Label>Personel</Label>
              <Select value={staffId || 'none'} onValueChange={(v) => setStaffId(v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Personel seç (isteğe bağlı)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Personel yok —</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{s.name}</span>
                        {s.position && <span className="text-muted-foreground text-xs">{s.position}</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === 'income' && customers.length > 0 && (
            <div className="space-y-2">
              <Label>Müşteri</Label>
              <Select value={customerId || 'none'} onValueChange={(v) => setCustomerId(v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Müşteri seç (isteğe bağlı)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Müşteri yok —</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{c.name}</span>
                        {c.contact && <span className="text-muted-foreground text-xs">{c.contact}</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Notlar</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ek açıklama..."
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
              <Label htmlFor="active">Aktif</Label>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
            <Button type="submit" disabled={loading || !name.trim() || !amount}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
