'use client'

import { Transaction, PAYMENT_METHOD_LABELS } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Pencil, FileText } from 'lucide-react'

interface Props {
  transactions: Transaction[]
  loading: boolean
  onEdit?: (t: Transaction) => void
  showActions?: boolean
}

export function TransactionTable({ transactions, loading, onEdit, showActions = true }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Henüz işlem yok
      </div>
    )
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tarih</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Açıklama</TableHead>
            <TableHead>Ödeme</TableHead>
            <TableHead className="w-8" />
            <TableHead className="text-right">Tutar</TableHead>
            {showActions && <TableHead className="w-20" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="text-sm whitespace-nowrap">
                {formatDate(t.transaction_date)}
              </TableCell>
              <TableCell>
                {t.category && (
                  <Badge
                    variant="secondary"
                    className="gap-1 text-xs"
                    style={{ borderLeft: `3px solid ${t.category.color}` }}
                  >
                    {t.category.name}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-sm max-w-xs">
                <div className="truncate">{t.description || '—'}</div>
                {t.supplier?.name && (
                  <div className="text-xs text-muted-foreground truncate">{t.supplier.name}</div>
                )}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {PAYMENT_METHOD_LABELS[t.payment_method]}
              </TableCell>
              <TableCell>
                {t.receipt_url && (
                  <a href={t.receipt_url} target="_blank" rel="noopener noreferrer" title="Fiş / Fatura">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground hover:text-primary transition-colors" />
                  </a>
                )}
              </TableCell>
              <TableCell className="text-right font-medium whitespace-nowrap">
                <span className={t.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </span>
              </TableCell>
              {showActions && (
                <TableCell>
                  <div className="flex gap-1 justify-end">
                    {onEdit && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(t)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
