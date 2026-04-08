'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { Supplier } from '@/types'
import { toast } from 'sonner'
import { useSharedData } from '@/contexts/SharedDataContext'

export function useSuppliers(activeOnly = false) {
  const { suppliers: allSuppliers, setSuppliers, loading } = useSharedData()
  const [supabase] = useState(() => createClient())

  const suppliers = useMemo(() => {
    if (!activeOnly) return allSuppliers
    return allSuppliers.filter(s => s.active)
  }, [allSuppliers, activeOnly])

  const createSupplier = async (values: Omit<Supplier, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Oturum açmanız gerekiyor'); return false }
    const { data, error } = await supabase
      .from('suppliers')
      .insert({ ...values, user_id: user.id })
      .select('*')
      .single()
    if (error) { toast.error('Tedarikçi eklenemedi: ' + error.message); return false }
    toast.success('Tedarikçi eklendi')
    setSuppliers(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    return true
  }

  const updateSupplier = async (id: string, values: Partial<Supplier>) => {
    const previous = allSuppliers.find(s => s.id === id)
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...values } : s))
    const { error } = await supabase.from('suppliers').update(values).eq('id', id)
    if (error) {
      toast.error('Tedarikçi güncellenemedi: ' + error.message)
      if (previous) setSuppliers(prev => prev.map(s => s.id === id ? previous : s))
      return false
    }
    toast.success('Tedarikçi güncellendi')
    return true
  }

  const deleteSupplier = async (id: string) => {
    const previous = allSuppliers.find(s => s.id === id)
    setSuppliers(prev => prev.filter(s => s.id !== id))
    const { error } = await supabase.from('suppliers').delete().eq('id', id)
    if (error) {
      toast.error('Tedarikçi silinemedi. Bu tedarikçiye ait işlemler var olabilir.')
      if (previous) setSuppliers(prev => [...prev, previous].sort((a, b) => a.name.localeCompare(b.name)))
      return false
    }
    toast.success('Tedarikçi silindi')
    return true
  }

  return { suppliers, loading, createSupplier, updateSupplier, deleteSupplier, refetch: () => {} }
}
