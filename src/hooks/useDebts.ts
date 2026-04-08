'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Debt } from '@/types'
import { toast } from 'sonner'

export function useDebts() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient())

  const fetchDebts = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setDebts(data)
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchDebts() }, [fetchDebts])

  const createDebt = async (values: Omit<Debt, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Oturum açmanız gerekiyor'); return false }
    const { data, error } = await supabase
      .from('debts')
      .insert({ ...values, user_id: user.id })
      .select('*')
      .single()
    if (error) { toast.error('Kayıt eklenemedi: ' + error.message); return false }
    toast.success('Kayıt eklendi')
    setDebts(prev => [data, ...prev])
    return true
  }

  const updateDebt = async (id: string, values: Partial<Debt>) => {
    const previous = debts.find(d => d.id === id)
    setDebts(prev => prev.map(d => d.id === id ? { ...d, ...values } : d))
    const { error } = await supabase.from('debts').update(values).eq('id', id)
    if (error) {
      toast.error('Kayıt güncellenemedi: ' + error.message)
      if (previous) setDebts(prev => prev.map(d => d.id === id ? previous : d))
      return false
    }
    toast.success('Kayıt güncellendi')
    return true
  }

  const deleteDebt = async (id: string) => {
    const previous = debts.find(d => d.id === id)
    setDebts(prev => prev.filter(d => d.id !== id))
    const { error } = await supabase.from('debts').delete().eq('id', id)
    if (error) {
      toast.error('Kayıt silinemedi')
      if (previous) setDebts(prev => [previous, ...prev])
      return false
    }
    toast.success('Kayıt silindi')
    return true
  }

  return { debts, loading, createDebt, updateDebt, deleteDebt }
}
