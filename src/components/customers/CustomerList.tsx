'use client'

import { Customer } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Pencil, Trash2, Building2, Phone, Mail } from 'lucide-react'

interface CustomerListProps {
  customers: Customer[]
  loading: boolean
  onEdit: (c: Customer) => void
  onDelete: (id: string) => void
}

export function CustomerList({ customers, loading, onEdit, onDelete }: CustomerListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    )
  }

  if (customers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Henüz müşteri eklenmemiş
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {customers.map((c) => (
        <div
          key={c.id}
          className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
        >
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm truncate">{c.name}</p>
              {!c.active && <Badge variant="secondary" className="text-xs">Pasif</Badge>}
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              {c.contact && (
                <span className="text-xs text-muted-foreground truncate">{c.contact}</span>
              )}
              {c.phone && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="w-3 h-3" />{c.phone}
                </span>
              )}
              {c.email && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                  <Mail className="w-3 h-3" />{c.email}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => onEdit(c)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="w-8 h-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(c.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
