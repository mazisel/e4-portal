'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Customer } from '@/types'
import { toast } from 'sonner'

export function useCustomers(activeOnly = false) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('customers').select('*').order('name')
    if (activeOnly) query = query.eq('active', true)
    const { data, error } = await query
    if (!error && data) setCustomers(data)
    setLoading(false)
  }, [activeOnly])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const createCustomer = async (values: Omit<Customer, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Oturum açmanız gerekiyor'); return false }
    const { error } = await supabase.from('customers').insert({ ...values, user_id: user.id })
    if (error) { toast.error('Müşteri eklenemedi: ' + error.message); return false }
    toast.success('Müşteri eklendi')
    await fetchCustomers()
    return true
  }

  const updateCustomer = async (id: string, values: Partial<Customer>) => {
    const { error } = await supabase.from('customers').update(values).eq('id', id)
    if (error) { toast.error('Müşteri güncellenemedi: ' + error.message); return false }
    toast.success('Müşteri güncellendi')
    await fetchCustomers()
    return true
  }

  const deleteCustomer = async (id: string) => {
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) { toast.error('Müşteri silinemedi. Bu müşteriye ait işlemler var olabilir.'); return false }
    toast.success('Müşteri silindi')
    await fetchCustomers()
    return true
  }

  return { customers, loading, createCustomer, updateCustomer, deleteCustomer, refetch: fetchCustomers }
}
