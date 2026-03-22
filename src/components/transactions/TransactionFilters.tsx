'use client'

import { TransactionFilters as Filters, TransactionType } from '@/types'
import { useCategories } from '@/hooks/useCategories'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { X, Search } from 'lucide-react'

interface Props {
  filters: Filters
  onChange: (filters: Filters) => void
}

export function TransactionFilters({ filters, onChange }: Props) {
  const { categories } = useCategories()

  const hasFilters = filters.type !== 'all' || filters.category_id || filters.date_from || filters.date_to || filters.search

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Ara</span>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={filters.search || ''}
            onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })}
            placeholder="Açıklama, kategori, müşteri..."
            className="pl-8 w-56"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Tür</span>
        <Select
          value={filters.type || 'all'}
          onValueChange={(v) => onChange({ ...filters, type: v as TransactionType | 'all', category_id: undefined })}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="income">Gelir</SelectItem>
            <SelectItem value="expense">Gider</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Kategori</span>
        <Select
          value={filters.category_id || 'all'}
          onValueChange={(v) => onChange({ ...filters, category_id: v === 'all' ? undefined : v })}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tüm kategoriler" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm kategoriler</SelectItem>
            {categories
              .filter((c) => !filters.type || filters.type === 'all' || c.type === filters.type)
              .map((c) => (
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

      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Başlangıç</span>
        <Input
          type="date"
          value={filters.date_from || ''}
          onChange={(e) => onChange({ ...filters, date_from: e.target.value || undefined })}
          className="w-36"
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Bitiş</span>
        <Input
          type="date"
          value={filters.date_to || ''}
          onChange={(e) => onChange({ ...filters, date_to: e.target.value || undefined })}
          className="w-36"
        />
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({ type: 'all', search: undefined })}
          className="gap-1 text-muted-foreground"
        >
          <X className="w-3.5 h-3.5" />
          Temizle
        </Button>
      )}
    </div>
  )
}
