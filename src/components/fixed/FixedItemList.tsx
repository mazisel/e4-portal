'use client'

import { FixedItem, FIXED_FREQUENCY_LABELS, MONTH_LABELS } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Pencil, Trash2, Calendar, User, Building2 } from 'lucide-react'

interface FixedItemListProps {
  items: FixedItem[]
  loading: boolean
  onEdit: (item: FixedItem) => void
  onDelete: (id: string) => void
  emptyMessage?: string
  customerMap?: Record<string, string>
  staffMap?: Record<string, string>
}

function dueDateLabel(item: FixedItem): string {
  if (item.due_day == null) return FIXED_FREQUENCY_LABELS[item.frequency]
  if (item.frequency === 'yearly' && item.due_month != null) {
    return `Her yıl ${MONTH_LABELS[item.due_month - 1]} ${item.due_day}. günü`
  }
  return `Her ay ${item.due_day}. günü`
}

export function FixedItemList({ items, loading, onEdit, onDelete, emptyMessage = 'Henüz kalem eklenmemiş', customerMap = {}, staffMap = {} }: FixedItemListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    )
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-6">{emptyMessage}</p>
  }

  const sorted = [...items].sort((a, b) => (a.due_day ?? 99) - (b.due_day ?? 99))

  return (
    <div className="space-y-2">
      {sorted.map((item) => (
        <div
          key={item.id}
          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
            item.active ? 'bg-card hover:bg-muted/50' : 'bg-muted/30 opacity-60'
          }`}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm truncate">{item.name}</p>
              {!item.active && <Badge variant="secondary" className="text-xs">Pasif</Badge>}
              {item.frequency === 'yearly' && (
                <Badge variant="outline" className="text-xs">Yıllık</Badge>
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{dueDateLabel(item)}</p>
            </div>
            {item.type === 'income' && item.customer_id && customerMap[item.customer_id] && (
              <div className="flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{customerMap[item.customer_id]}</p>
              </div>
            )}
            {item.type === 'expense' && item.staff_id && staffMap[item.staff_id] && (
              <div className="flex items-center gap-1 mt-0.5">
                <User className="w-3 h-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{staffMap[item.staff_id]}</p>
              </div>
            )}
          </div>
          <p className={`font-semibold text-sm flex-shrink-0 ${item.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
            ₺{item.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex gap-1 flex-shrink-0">
            <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => onEdit(item)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="w-8 h-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
