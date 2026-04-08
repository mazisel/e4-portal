'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Transaction, TransactionFilters } from '@/types'
import { toast } from 'sonner'

const TX_SELECT = '*, category:categories(*), staff:staff(*), customer:customers(*), supplier:suppliers(*)'

export function useTransactions(filters?: TransactionFilters) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient())

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('transactions')
      .select(TX_SELECT)
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

    query = query.limit(200)

    const { data, error } = await query
    if (!error && data) setTransactions(data as Transaction[])
    setLoading(false)
  }, [supabase, filters?.type, filters?.category_id, filters?.date_from, filters?.date_to])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const createTransaction = async (values: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'category' | 'staff' | 'customer'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Oturum açmanız gerekiyor'); return { ok: false } }
    const { data: inserted, error } = await supabase
      .from('transactions')
      .insert({ ...values, user_id: user.id })
      .select('id')
      .single()
    if (error) {
      toast.error('İşlem eklenemedi: ' + error.message)
      return { ok: false }
    }
    toast.success('İşlem eklendi')
    // Fetch only the newly inserted row with all joins
    const { data: newTx } = await supabase
      .from('transactions')
      .select(TX_SELECT)
      .eq('id', inserted.id)
      .single()
    if (newTx) setTransactions(prev => [newTx as Transaction, ...prev])
    return { ok: true, id: inserted.id }
  }

  const updateTransaction = async (id: string, values: Partial<Transaction>) => {
    const { category: _c, staff: _s, customer: _cu, supplier: _su, ...rest } = values as Transaction
    const { error } = await supabase.from('transactions').update(rest).eq('id', id)
    if (error) {
      toast.error('İşlem güncellenemedi: ' + error.message)
      return { ok: false }
    }
    toast.success('İşlem güncellendi')
    // Fetch only the updated row with all joins
    const { data: updatedTx } = await supabase
      .from('transactions')
      .select(TX_SELECT)
      .eq('id', id)
      .single()
    if (updatedTx) setTransactions(prev => prev.map(t => t.id === id ? updatedTx as Transaction : t))
    return { ok: true, id }
  }

  const deleteTransaction = async (id: string) => {
    const previous = transactions.find(t => t.id === id)
    setTransactions(prev => prev.filter(t => t.id !== id))
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) {
      toast.error('İşlem silinemedi')
      if (previous) setTransactions(prev => [previous, ...prev])
      return false
    }
    toast.success('İşlem silindi')
    return true
  }

  return { transactions, loading, createTransaction, updateTransaction, deleteTransaction, refetch: fetchTransactions }
}
