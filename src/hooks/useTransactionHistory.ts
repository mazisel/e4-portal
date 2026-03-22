'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { TransactionHistory } from '@/types'

export function useTransactionHistory(transactionId: string | undefined) {
  const [history, setHistory] = useState<TransactionHistory[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!transactionId) { setHistory([]); return }
    setLoading(true)
    supabase
      .from('transaction_history')
      .select('*')
      .eq('transaction_id', transactionId)
      .order('changed_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setHistory(data)
        setLoading(false)
      })
  }, [transactionId])

  return { history, loading }
}
