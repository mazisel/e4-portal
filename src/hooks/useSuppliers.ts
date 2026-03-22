'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Supplier } from '@/types'
import { toast } from 'sonner'

export function useSuppliers(activeOnly = false) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchSuppliers = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('suppliers').select('*').order('name')
    if (activeOnly) query = query.eq('active', true)
    const { data, error } = await query
    if (!error && data) setSuppliers(data)
    setLoading(false)
  }, [activeOnly])

  useEffect(() => {
    fetchSuppliers()
  }, [fetchSuppliers])

  const createSupplier = async (values: Omit<Supplier, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Oturum açmanız gerekiyor'); return false }
    const { error } = await supabase.from('suppliers').insert({ ...values, user_id: user.id })
    if (error) { toast.error('Tedarikçi eklenemedi: ' + error.message); return false }
    toast.success('Tedarikçi eklendi')
    await fetchSuppliers()
    return true
  }

  const updateSupplier = async (id: string, values: Partial<Supplier>) => {
    const { error } = await supabase.from('suppliers').update(values).eq('id', id)
    if (error) { toast.error('Tedarikçi güncellenemedi: ' + error.message); return false }
    toast.success('Tedarikçi güncellendi')
    await fetchSuppliers()
    return true
  }

  const deleteSupplier = async (id: string) => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id)
    if (error) { toast.error('Tedarikçi silinemedi. Bu tedarikçiye ait işlemler var olabilir.'); return false }
    toast.success('Tedarikçi silindi')
    await fetchSuppliers()
    return true
  }

  return { suppliers, loading, createSupplier, updateSupplier, deleteSupplier, refetch: fetchSuppliers }
}
