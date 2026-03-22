'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Transaction, TransactionFilters } from '@/types'
import { toast } from 'sonner'

export function useTransactions(filters?: TransactionFilters) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('transactions')
      .select('*, category:categories(*), staff:staff(*), customer:customers(*), supplier:suppliers(*)')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (filters?.type && filters.type !== 'all') {
      query = query.eq('type', filters.type)
    }
    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id)
    }
    if (filters?.date_from) {
      query = query.gte('transaction_date', filters.date_from)
    }
    if (filters?.date_to) {
      query = query.lte('transaction_date', filters.date_to)
    }

    const { data, error } = await query
    if (!error && data) setTransactions(data as Transaction[])
    setLoading(false)
  }, [filters?.type, filters?.category_id, filters?.date_from, filters?.date_to])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const createTransaction = async (values: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'category' | 'staff' | 'customer'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Oturum açmanız gerekiyor'); return { ok: false } }
    const { data, error } = await supabase.from('transactions').insert({ ...values, user_id: user.id }).select('id').single()
    if (error) {
      toast.error('İşlem eklenemedi: ' + error.message)
      return { ok: false }
    }
    toast.success('İşlem eklendi')
    await fetchTransactions()
    return { ok: true, id: data.id }
  }

  const updateTransaction = async (id: string, values: Partial<Transaction>) => {
    const { category: _c, staff: _s, customer: _cu, supplier: _su, ...rest } = values as Transaction
    const { error } = await supabase.from('transactions').update(rest).eq('id', id)
    if (error) {
      toast.error('İşlem güncellenemedi: ' + error.message)
      return { ok: false }
    }
    toast.success('İşlem güncellendi')
    await fetchTransactions()
    return { ok: true, id }
  }

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) {
      toast.error('İşlem silinemedi')
      return false
    }
    toast.success('İşlem silindi')
    await fetchTransactions()
    return true
  }

  return { transactions, loading, createTransaction, updateTransaction, deleteTransaction, refetch: fetchTransactions }
}
