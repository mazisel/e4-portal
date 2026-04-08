'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Category, TransactionType } from '@/types'
import { toast } from 'sonner'

export function useCategories(filterType?: TransactionType) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient())

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
  }, [supabase, filterType])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const createCategory = async (values: Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Oturum açmanız gerekiyor'); return false }
    const { data, error } = await supabase
      .from('categories')
      .insert({ ...values, user_id: user.id })
      .select('*')
      .single()
    if (error) {
      toast.error('Kategori eklenemedi: ' + error.message)
      return false
    }
    toast.success('Kategori eklendi')
    setCategories(prev => {
      if (filterType && data.type !== filterType) return prev
      return [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
    })
    return true
  }

  const updateCategory = async (id: string, values: Partial<Category>) => {
    const previous = categories.find(c => c.id === id)
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...values } : c))
    const { error } = await supabase.from('categories').update(values).eq('id', id)
    if (error) {
      toast.error('Kategori güncellenemedi: ' + error.message)
      if (previous) setCategories(prev => prev.map(c => c.id === id ? previous : c))
      return false
    }
    toast.success('Kategori güncellendi')
    return true
  }

  const deleteCategory = async (id: string) => {
    const previous = categories.find(c => c.id === id)
    setCategories(prev => prev.filter(c => c.id !== id))
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) {
      toast.error('Kategori silinemedi. Bu kategoriye ait işlemler var olabilir.')
      if (previous) setCategories(prev => [...prev, previous].sort((a, b) => a.name.localeCompare(b.name)))
      return false
    }
    toast.success('Kategori silindi')
    return true
  }

  return { categories, loading, createCategory, updateCategory, deleteCategory, refetch: fetchCategories }
}
