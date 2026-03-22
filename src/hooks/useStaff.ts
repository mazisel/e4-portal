'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Staff } from '@/types'
import { toast } from 'sonner'

export function useStaff(activeOnly = false) {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchStaff = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('staff').select('*').order('name')
    if (activeOnly) query = query.eq('active', true)
    const { data, error } = await query
    if (!error && data) setStaff(data)
    setLoading(false)
  }, [activeOnly])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  const createStaff = async (values: Omit<Staff, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Oturum açmanız gerekiyor'); return false }
    const { error } = await supabase.from('staff').insert({ ...values, user_id: user.id })
    if (error) { toast.error('Personel eklenemedi: ' + error.message); return false }
    toast.success('Personel eklendi')
    await fetchStaff()
    return true
  }

  const updateStaff = async (id: string, values: Partial<Staff>) => {
    const { error } = await supabase.from('staff').update(values).eq('id', id)
    if (error) { toast.error('Personel güncellenemedi: ' + error.message); return false }
    toast.success('Personel güncellendi')
    await fetchStaff()
    return true
  }

  const deleteStaff = async (id: string) => {
    const { error } = await supabase.from('staff').delete().eq('id', id)
    if (error) { toast.error('Personel silinemedi. Bu personele ait işlemler var olabilir.'); return false }
    toast.success('Personel silindi')
    await fetchStaff()
    return true
  }

  return { staff, loading, createStaff, updateStaff, deleteStaff, refetch: fetchStaff }
}
