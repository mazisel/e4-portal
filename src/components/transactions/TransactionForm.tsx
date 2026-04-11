'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Transaction, TransactionType, PaymentMethod, PAYMENT_METHOD_LABELS } from '@/types'
import { useCategories } from '@/hooks/useCategories'
import { useStaff } from '@/hooks/useStaff'
import { useCustomers } from '@/hooks/useCustomers'
import { useSuppliers } from '@/hooks/useSuppliers'
import { createClient } from '@/lib/supabase'
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
import { Paperclip, MessageCircle, X, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { useTransactionHistory } from '@/hooks/useTransactionHistory'
import { TransactionHistoryPanel, computeDiff } from './TransactionHistoryPanel'

type FormValues = Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'category' | 'staff' | 'customer'>

interface TransactionFormProps {
  open: boolean
  onClose: () => void
  onSave: (values: FormValues) => Promise<{ ok: boolean; id?: string }>
  initial?: Transaction | null
}

const today = () => new Date().toISOString().split('T')[0]
const DEFAULT_RECEIPT_PATH = 'storage/v1/object/public/receipts/'

async function uploadReceipt(file: File, userId: string): Promise<string | null> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('receipts').upload(path, file)
  if (error) { toast.error('Dosya yüklenemedi: ' + error.message); return null }
  const { data } = supabase.storage.from('receipts').getPublicUrl(path)
  return data.publicUrl
}

async function sendWhatsapp(phone: string, message: string, variables?: Record<string, string>) {
  const res = await fetch('/api/whatsapp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, message, variables }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'WhatsApp mesajı gönderilemedi')
}

function toTwilioStoragePath(receiptUrl: string | null): string {
  if (!receiptUrl) return DEFAULT_RECEIPT_PATH

  const stripLeadingSlashes = (value: string) => value.replace(/^\/+/, '')

  try {
    const parsedPath = stripLeadingSlashes(new URL(receiptUrl).pathname)
    if (!parsedPath) return DEFAULT_RECEIPT_PATH

    const storageStart = parsedPath.indexOf('storage/')
    return storageStart >= 0 ? parsedPath.slice(storageStart) : parsedPath
  } catch {
    const normalized = stripLeadingSlashes(receiptUrl)
    if (!normalized) return DEFAULT_RECEIPT_PATH

    const storageStart = normalized.indexOf('storage/')
    return storageStart >= 0 ? normalized.slice(storageStart) : normalized
  }
}

export function TransactionForm({ open, onClose, onSave, initial }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>('expense')
  const [categoryId, setCategoryId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(today())
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [notes, setNotes] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [sendWhatsappChecked, setSendWhatsappChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { categories } = useCategories(type)
  const { staff } = useStaff(true)
  const { customers } = useCustomers(true)
  const { suppliers } = useSuppliers(true)
  const { history, loading: historyLoading } = useTransactionHistory(initial?.id)

  const categoryMap = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name])), [categories])
  const staffMap = useMemo(() => Object.fromEntries(staff.map((s) => [s.id, s.name])), [staff])
  const customerMap = useMemo(() => Object.fromEntries(customers.map((c) => [c.id, c.name])), [customers])
  const supplierMap = useMemo(() => Object.fromEntries(suppliers.map((s) => [s.id, s.name])), [suppliers])

  const selectedCustomer = customers.find((c) => c.id === customerId)
  const canSendWhatsapp = type === 'income' && !!selectedCustomer?.phone

  useEffect(() => {
    if (initial) {
      setType(initial.type)
      setCategoryId(initial.category_id)
      setStaffId(initial.staff_id || '')
      setCustomerId(initial.customer_id || '')
      setSupplierId(initial.supplier_id || '')
      setAmount(String(initial.amount))
      setDescription(initial.description || '')
      setDate(initial.transaction_date)
      setPaymentMethod(initial.payment_method)
      setNotes(initial.notes || '')
      setReceiptFile(null)
      setSendWhatsappChecked(false)
    } else {
      setType('expense')
      setCategoryId('')
      setStaffId('')
      setCustomerId('')
      setSupplierId('')
      setAmount('')
      setDescription('')
      setDate(today())
      setPaymentMethod('cash')
      setNotes('')
      setReceiptFile(null)
      setSendWhatsappChecked(false)
    }
  }, [initial, open])

  useEffect(() => {
    if (!initial) {
      setCategoryId('')
      setStaffId('')
      setCustomerId('')
      setSupplierId('')
      setSendWhatsappChecked(false)
    }
  }, [type])

  // WhatsApp seçeneği kapansın müşteri değişince telefonu yoksa
  useEffect(() => {
    if (!canSendWhatsapp) setSendWhatsappChecked(false)
  }, [canSendWhatsapp])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryId || !amount) return
    setLoading(true)

    // 1. Dosya yükle
    let receiptUrl: string | null = initial?.receipt_url ?? null
    if (receiptFile) {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        receiptUrl = await uploadReceipt(receiptFile, user.id)
      }
    }

    // 2. İşlemi kaydet
    const result = await onSave({
      type,
      category_id: categoryId,
      staff_id: type === 'expense' && staffId ? staffId : null,
      customer_id: type === 'income' && customerId ? customerId : null,
      supplier_id: type === 'expense' && supplierId ? supplierId : null,
      receipt_url: receiptUrl,
      amount: parseFloat(amount),
      description: description.trim() || null,
      transaction_date: date,
      payment_method: paymentMethod,
      notes: notes.trim() || null,
    })

    // 3. WhatsApp gönder
    if (result.ok && sendWhatsappChecked && selectedCustomer?.phone) {
      // Sizin sağladığınız tam şablon metni (Fallback olarak)
      const whatsappText = `Sayın ${selectedCustomer.name} faturanız oluşturulmuştur. Teşekkür ederiz.`
      
      // Twilio şablonunda domain sabit (örn: https://e4labs.com.tr/{{1}}).
      // Bu yüzden her durumda sadece "storage/v1/..." yolunu gönderiyoruz.
      const receiptPath = toTwilioStoragePath(receiptUrl)

      try {
        await sendWhatsapp(selectedCustomer.phone, whatsappText, {
          "4": selectedCustomer.name,
          "1": receiptPath
        })
        toast.success('WhatsApp mesajı gönderildi')
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'WhatsApp mesajı gönderilemedi')
      }
    }

    setLoading(false)
    if (result.ok) onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{initial ? 'İşlem Düzenle' : 'Yeni İşlem'}</DialogTitle>
          {initial?.created_by_email && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 pt-0.5">
              <span>Ekleyen:</span>
              <span className="font-medium">{initial.created_by_email}</span>
              <span className="mx-1">·</span>
              <span>{new Date(initial.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </p>
          )}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kategori *</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seç..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                        {c.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
          </div>

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

          {type === 'expense' && suppliers.length > 0 && (
            <div className="space-y-2">
              <Label>Tedarikçi</Label>
              <Select value={supplierId || 'none'} onValueChange={(v) => setSupplierId(v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tedarikçi seç (isteğe bağlı)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Tedarikçi yok —</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{s.name}</span>
                        {s.contact && <span className="text-muted-foreground text-xs">{s.contact}</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tarih *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Ödeme Yöntemi</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                    <SelectItem key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Açıklama</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="İşlem açıklaması..."
            />
          </div>

          <div className="space-y-2">
            <Label>Notlar</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ek notlar..."
            />
          </div>

          {/* Fiş / Fatura yükleme */}
          <div className="space-y-2">
            <Label>Fiş / Fatura</Label>
            {initial?.receipt_url && !receiptFile ? (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/40">
                <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <a
                  href={initial.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline truncate flex-1"
                >
                  Mevcut belge
                </a>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="w-6 h-6 flex-shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : receiptFile ? (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/40">
                <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm truncate flex-1">{receiptFile.name}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="w-6 h-6 text-destructive flex-shrink-0"
                  onClick={() => { setReceiptFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-2 p-2 border border-dashed rounded-md text-sm text-muted-foreground hover:bg-muted/40 transition-colors"
              >
                <Paperclip className="w-4 h-4" />
                Fiş veya fatura yükle (isteğe bağlı)
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {/* WhatsApp gönderme seçeneği - sadece gelir + müşteri + telefon varsa */}
          {canSendWhatsapp && (
            <div className="flex items-start gap-3 p-3 border rounded-md bg-green-50 dark:bg-green-950/20">
              <input
                id="send-whatsapp"
                type="checkbox"
                checked={sendWhatsappChecked}
                onChange={(e) => setSendWhatsappChecked(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded"
              />
              <div>
                <Label htmlFor="send-whatsapp" className="flex items-center gap-2 cursor-pointer">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  WhatsApp bildirim gönder
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedCustomer?.name} adlı müşteriye {selectedCustomer?.phone} numarasına ödeme alındı bildirimi gönderilir
                </p>
              </div>
            </div>
          )}

          {/* Düzenleme geçmişi - sadece edit modda */}
          {initial && (
            <div className="border rounded-md overflow-hidden">
              <button
                type="button"
                onClick={() => setHistoryOpen((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  Düzenleme Geçmişi
                  {(() => {
                    const count = history.filter(
                      (e) => computeDiff(e, categoryMap, staffMap, customerMap, supplierMap).length > 0
                    ).length
                    return count > 0 ? (
                      <span className="bg-muted rounded-full px-1.5 py-0.5 text-[10px]">{count}</span>
                    ) : null
                  })()}
                </span>
                {historyOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {historyOpen && (
                <div className="px-3 pb-3">
                  <TransactionHistoryPanel
                    history={history}
                    loading={historyLoading}
                    categories={categoryMap}
                    staffMap={staffMap}
                    customerMap={customerMap}
                    supplierMap={supplierMap}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
            <Button type="submit" disabled={loading || !categoryId || !amount}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
