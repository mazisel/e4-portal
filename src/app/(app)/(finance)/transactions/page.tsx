'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTransactions } from '@/hooks/useTransactions'
import { TransactionTable } from '@/components/transactions/TransactionTable'
import { TransactionFilters } from '@/components/transactions/TransactionFilters'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { Transaction, TransactionFilters as Filters } from '@/types'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function TransactionsPage() {
  const [filters, setFilters] = useState<Filters>({ type: 'all' })
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const { transactions, loading, updateTransaction } = useTransactions(filters)

  const q = filters.search?.toLowerCase().trim()
  const visibleTransactions = q
    ? transactions.filter((t) =>
        [t.description, t.notes, t.category?.name, t.customer?.name, t.staff?.name]
          .some((field) => field?.toLowerCase().includes(q))
      )
    : transactions

  const handleEdit = (t: Transaction) => {
    setEditing(t)
    setFormOpen(true)
  }

  const handleClose = () => {
    setFormOpen(false)
    setEditing(null)
  }

  const handleSave = async (values: any) => {
    if (editing) return updateTransaction(editing.id, values)
    return { ok: false }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">İşlemler</h1>
          <p className="text-sm text-muted-foreground">Tüm gelir ve gider kayıtları</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/transactions/new">
            <Plus className="w-4 h-4" />
            Yeni İşlem
          </Link>
        </Button>
      </div>

      <TransactionFilters filters={filters} onChange={setFilters} />

      <TransactionTable
        transactions={visibleTransactions}
        loading={loading}
        onEdit={handleEdit}
      />

      <TransactionForm
        open={formOpen}
        onClose={handleClose}
        onSave={handleSave}
        initial={editing}
      />
    </div>
  )
}
