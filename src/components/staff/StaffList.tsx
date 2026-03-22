'use client'

import { Staff } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Pencil, Trash2, User } from 'lucide-react'

interface StaffListProps {
  staff: Staff[]
  loading: boolean
  onEdit: (s: Staff) => void
  onDelete: (id: string) => void
}

export function StaffList({ staff, loading, onEdit, onDelete }: StaffListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    )
  }

  if (staff.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Henüz personel eklenmemiş
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {staff.map((s) => (
        <div
          key={s.id}
          className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
        >
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm truncate">{s.name}</p>
              {!s.active && <Badge variant="secondary" className="text-xs">Pasif</Badge>}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {s.position || 'Pozisyon belirtilmemiş'}
              {s.monthly_salary != null && ` · ₺${s.monthly_salary.toLocaleString('tr-TR')} / ay`}
            </p>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => onEdit(s)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="w-8 h-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(s.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
