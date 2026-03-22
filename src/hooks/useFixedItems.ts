'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { FixedItem, TransactionType } from '@/types'
import { toast } from 'sonner'

export function useFixedItems(filterType?: TransactionType) {
  const [items, setItems] = useState<FixedItem[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchItems = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('fixed_items').select('*').order('name')
    if (filterType) query = query.eq('type', filterType)
    const { data, error } = await query
    if (!error && data) setItems(data)
    setLoading(false)
  }, [filterType])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const createItem = async (values: Omit<FixedItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Oturum açmanız gerekiyor'); return false }
    const { error } = await supabase.from('fixed_items').insert({ ...values, user_id: user.id })
    if (error) { toast.error('Kalem eklenemedi: ' + error.message); return false }
    toast.success('Kalem eklendi')
    await fetchItems()
    return true
  }

  const updateItem = async (id: string, values: Partial<FixedItem>) => {
    const { error } = await supabase.from('fixed_items').update(values).eq('id', id)
    if (error) { toast.error('Kalem güncellenemedi: ' + error.message); return false }
    toast.success('Kalem güncellendi')
    await fetchItems()
    return true
  }

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('fixed_items').delete().eq('id', id)
    if (error) { toast.error('Kalem silinemedi'); return false }
    toast.success('Kalem silindi')
    await fetchItems()
    return true
  }

  return { items, loading, createItem, updateItem, deleteItem, refetch: fetchItems }
}
