'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { Staff } from '@/types'
import { toast } from 'sonner'
import { useSharedData } from '@/contexts/SharedDataContext'

export function useStaff(activeOnly = false) {
  const { staff: allStaff, setStaff, loading } = useSharedData()
  const [supabase] = useState(() => createClient())

  const staff = useMemo(() => {
    if (!activeOnly) return allStaff
    return allStaff.filter(s => s.active)
  }, [allStaff, activeOnly])

  const createStaff = async (values: Omit<Staff, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Oturum açmanız gerekiyor'); return false }
    const { data, error } = await supabase
      .from('staff')
      .insert({ ...values, user_id: user.id })
      .select('*')
      .single()
    if (error) { toast.error('Personel eklenemedi: ' + error.message); return false }
    toast.success('Personel eklendi')
    setStaff(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    return true
  }

  const updateStaff = async (id: string, values: Partial<Staff>) => {
    const previous = allStaff.find(s => s.id === id)
    setStaff(prev => prev.map(s => s.id === id ? { ...s, ...values } : s))
    const { error } = await supabase.from('staff').update(values).eq('id', id)
    if (error) {
      toast.error('Personel güncellenemedi: ' + error.message)
      if (previous) setStaff(prev => prev.map(s => s.id === id ? previous : s))
      return false
    }
    toast.success('Personel güncellendi')
    return true
  }

  const deleteStaff = async (id: string) => {
    const previous = allStaff.find(s => s.id === id)
    setStaff(prev => prev.filter(s => s.id !== id))
    const { error } = await supabase.from('staff').delete().eq('id', id)
    if (error) {
      toast.error('Personel silinemedi. Bu personele ait işlemler var olabilir.')
      if (previous) setStaff(prev => [...prev, previous].sort((a, b) => a.name.localeCompare(b.name)))
      return false
    }
    toast.success('Personel silindi')
    return true
  }

  return { staff, loading, createStaff, updateStaff, deleteStaff, refetch: () => {} }
}
