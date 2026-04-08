'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Advance } from '@/types'
import { toast } from 'sonner'

export function useAdvances() {
  const [advances, setAdvances] = useState<Advance[]>([])
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient())

  const fetchAdvances = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('advances')
      .select('*')
      .order('advance_date', { ascending: false })
      .order('created_at', { ascending: false })
    if (!error && data) setAdvances(data)
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchAdvances() }, [fetchAdvances])

  const createAdvance = async (values: Omit<Advance, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Oturum açmanız gerekiyor'); return false }
    const { data, error } = await supabase
      .from('advances')
      .insert({ ...values, user_id: user.id })
      .select('*')
      .single()
    if (error) { toast.error('Avans eklenemedi: ' + error.message); return false }
    toast.success('Avans eklendi')
    setAdvances(prev => [data, ...prev])
    return true
  }

  const updateAdvance = async (id: string, values: Partial<Advance>) => {
    const previous = advances.find(a => a.id === id)
    setAdvances(prev => prev.map(a => a.id === id ? { ...a, ...values } : a))
    const { error } = await supabase.from('advances').update(values).eq('id', id)
    if (error) {
      toast.error('Avans güncellenemedi: ' + error.message)
      if (previous) setAdvances(prev => prev.map(a => a.id === id ? previous : a))
      return false
    }
    toast.success('Avans güncellendi')
    return true
  }

  const deleteAdvance = async (id: string) => {
    const previous = advances.find(a => a.id === id)
    setAdvances(prev => prev.filter(a => a.id !== id))
    const { error } = await supabase.from('advances').delete().eq('id', id)
    if (error) {
      toast.error('Avans silinemedi')
      if (previous) setAdvances(prev => [previous, ...prev])
      return false
    }
    toast.success('Avans silindi')
    return true
  }

  return { advances, loading, createAdvance, updateAdvance, deleteAdvance }
}
