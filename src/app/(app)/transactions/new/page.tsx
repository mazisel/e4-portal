'use client'

export const dynamic = 'force-dynamic'

import { useRouter } from 'next/navigation'
import { useTransactions } from '@/hooks/useTransactions'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { Transaction } from '@/types'

export default function NewTransactionPage() {
  const router = useRouter()
  const { createTransaction } = useTransactions()

  const handleSave = async (values: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'category' | 'staff' | 'customer'>) => {
    const result = await createTransaction(values)
    if (result.ok) router.push('/transactions')
    return result
  }

  return (
    <TransactionForm
      open={true}
      onClose={() => router.push('/transactions')}
      onSave={handleSave}
    />
  )
}
