'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Customer } from '@/types'
import { toast } from 'sonner'

export function useCustomers(activeOnly = false) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient())

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('customers').select('*').order('name')
    if (activeOnly) query = query.eq('active', true)
    const { data, error } = await query
    if (!error && data) setCustomers(data)
    setLoading(false)
  }, [supabase, activeOnly])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const createCustomer = async (values: Omit<Customer, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Oturum açmanız gerekiyor'); return false }
    const { data, error } = await supabase
      .from('customers')
      .insert({ ...values, user_id: user.id })
      .select('*')
      .single()
    if (error) { toast.error('Müşteri eklenemedi: ' + error.message); return false }
    toast.success('Müşteri eklendi')
    setCustomers(prev => {
      if (activeOnly && !data.active) return prev
      return [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
    })
    return true
  }

  const updateCustomer = async (id: string, values: Partial<Customer>) => {
    const previous = customers.find(c => c.id === id)
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...values } : c))
    const { error } = await supabase.from('customers').update(values).eq('id', id)
    if (error) {
      toast.error('Müşteri güncellenemedi: ' + error.message)
      if (previous) setCustomers(prev => prev.map(c => c.id === id ? previous : c))
      return false
    }
    toast.success('Müşteri güncellendi')
    return true
  }

  const deleteCustomer = async (id: string) => {
    const previous = customers.find(c => c.id === id)
    setCustomers(prev => prev.filter(c => c.id !== id))
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) {
      toast.error('Müşteri silinemedi. Bu müşteriye ait işlemler var olabilir.')
      if (previous) setCustomers(prev => [...prev, previous].sort((a, b) => a.name.localeCompare(b.name)))
      return false
    }
    toast.success('Müşteri silindi')
    return true
  }

  return { customers, loading, createCustomer, updateCustomer, deleteCustomer, refetch: fetchCustomers }
}
