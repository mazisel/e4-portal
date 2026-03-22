'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Category, TransactionType } from '@/types'
import { toast } from 'sonner'

export function useCategories(filterType?: TransactionType) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('categories')
      .select('*')
      .order('name')

    if (filterType) {
      query = query.eq('type', filterType)
    }

    const { data, error } = await query
    if (!error && data) setCategories(data)
    setLoading(false)
  }, [filterType])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const createCategory = async (values: Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Oturum açmanız gerekiyor'); return false }
    const { error } = await supabase.from('categories').insert({ ...values, user_id: user.id })
    if (error) {
      toast.error('Kategori eklenemedi: ' + error.message)
      return false
    }
    toast.success('Kategori eklendi')
    await fetchCategories()
    return true
  }

  const updateCategory = async (id: string, values: Partial<Category>) => {
    const { error } = await supabase.from('categories').update(values).eq('id', id)
    if (error) {
      toast.error('Kategori güncellenemedi: ' + error.message)
      return false
    }
    toast.success('Kategori güncellendi')
    await fetchCategories()
    return true
  }

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) {
      toast.error('Kategori silinemedi. Bu kategoriye ait işlemler var olabilir.')
      return false
    }
    toast.success('Kategori silindi')
    await fetchCategories()
    return true
  }

  return { categories, loading, createCategory, updateCategory, deleteCategory, refetch: fetchCategories }
}
