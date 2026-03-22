'use client'

import { TransactionHistory, PAYMENT_METHOD_LABELS } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import { History, UserPen } from 'lucide-react'

interface Props {
  history: TransactionHistory[]
  loading: boolean
  categories: Record<string, string>
  staffMap: Record<string, string>
  customerMap: Record<string, string>
  supplierMap?: Record<string, string>
}

const FIELD_LABELS: Record<string, string> = {
  type: 'Tür',
  amount: 'Tutar',
  category_id: 'Kategori',
  staff_id: 'Personel',
  customer_id: 'Müşteri',
  supplier_id: 'Tedarikçi',
  description: 'Açıklama',
  transaction_date: 'Tarih',
  payment_method: 'Ödeme Yöntemi',
  notes: 'Notlar',
  receipt_url: 'Fiş/Fatura',
}

const TRACKED = Object.keys(FIELD_LABELS)

function formatValue(
  field: string,
  value: unknown,
  categories: Record<string, string>,
  staffMap: Record<string, string>,
  customerMap: Record<string, string>,
  supplierMap: Record<string, string>
): string {
  if (value === null || value === undefined || value === '') return '—'
  if (field === 'amount') return `₺${Number(value).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
  if (field === 'type') return value === 'income' ? 'Gelir' : 'Gider'
  if (field === 'payment_method') return PAYMENT_METHOD_LABELS[value as keyof typeof PAYMENT_METHOD_LABELS] ?? String(value)
  if (field === 'category_id') return categories[String(value)] ?? 'Bilinmeyen kategori'
  if (field === 'staff_id') return staffMap[String(value)] ?? 'Bilinmeyen personel'
  if (field === 'customer_id') return customerMap[String(value)] ?? 'Bilinmeyen müşteri'
  if (field === 'supplier_id') return supplierMap[String(value)] ?? 'Bilinmeyen tedarikçi'
  if (field === 'receipt_url') return value ? 'Var' : '—'
  if (field === 'transaction_date') {
    return new Date(String(value)).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  return String(value)
}

export function computeDiff(
  entry: TransactionHistory,
  categories: Record<string, string>,
  staffMap: Record<string, string>,
  customerMap: Record<string, string>,
  supplierMap: Record<string, string> = {}
) {
  const changes: { field: string; label: string; from: string; to: string }[] = []
  for (const field of TRACKED) {
    const oldVal = entry.old_data[field]
    const newVal = entry.new_data[field]
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({
        field,
        label: FIELD_LABELS[field],
        from: formatValue(field, oldVal, categories, staffMap, customerMap, supplierMap),
        to: formatValue(field, newVal, categories, staffMap, customerMap, supplierMap),
      })
    }
  }
  return changes
}

export function TransactionHistoryPanel({ history, loading, categories, staffMap, customerMap, supplierMap = {} }: Props) {
  if (loading) {
    return (
      <div className="space-y-2 pt-2">
        {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-3">
        Henüz düzenleme geçmişi yok
      </p>
    )
  }

  return (
    <div className="space-y-3 pt-1">
      {history.map((entry) => {
        const changes = computeDiff(entry, categories, staffMap, customerMap, supplierMap)
        if (changes.length === 0) return null
        const date = new Date(entry.changed_at)
        const dateStr = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
        const timeStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        return (
          <div key={entry.id} className="border rounded-md overflow-hidden text-xs">
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 flex-wrap">
              <History className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="font-medium text-muted-foreground">{dateStr} – {timeStr}</span>
              {entry.user_email && (
                <span className="flex items-center gap-1 ml-auto text-muted-foreground">
                  <UserPen className="w-3 h-3" />
                  {entry.user_email}
                </span>
              )}
            </div>
            <div className="divide-y">
              {changes.map((c) => (
                <div key={c.field} className="grid grid-cols-[100px_1fr] gap-2 px-3 py-1.5 items-start">
                  <span className="text-muted-foreground font-medium">{c.label}</span>
                  <span className="flex flex-wrap items-center gap-1">
                    <span className="line-through text-muted-foreground">{c.from}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium">{c.to}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
