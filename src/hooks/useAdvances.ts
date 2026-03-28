'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Advance } from '@/types'
import { toast } from 'sonner'

export function useAdvances() {
  const [advances, setAdvances] = useState<Advance[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchAdvances = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('advances')
      .select('*')
      .order('advance_date', { ascending: false })
      .order('created_at', { ascending: false })
    if (!error && data) setAdvances(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAdvances() }, [fetchAdvances])

  const createAdvance = async (values: Omit<Advance, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Oturum açmanız gerekiyor'); return false }
    const { error } = await supabase.from('advances').insert({ ...values, user_id: user.id })
    if (error) { toast.error('Avans eklenemedi: ' + error.message); return false }
    toast.success('Avans eklendi')
    await fetchAdvances()
    return true
  }

  const updateAdvance = async (id: string, values: Partial<Advance>) => {
    const { error } = await supabase.from('advances').update(values).eq('id', id)
    if (error) { toast.error('Avans güncellenemedi: ' + error.message); return false }
    toast.success('Avans güncellendi')
    await fetchAdvances()
    return true
  }

  const deleteAdvance = async (id: string) => {
    const { error } = await supabase.from('advances').delete().eq('id', id)
    if (error) { toast.error('Avans silinemedi'); return false }
    toast.success('Avans silindi')
    await fetchAdvances()
    return true
  }

  return { advances, loading, createAdvance, updateAdvance, deleteAdvance }
}
