'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { KasaEntry } from '@/types'
import { toast } from 'sonner'

export function useKasa() {
  const [entries, setEntries] = useState<KasaEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient())

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('kasa_entries')
      .select('*')
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false })
    if (!error && data) setEntries(data)
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const createEntry = async (values: Omit<KasaEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Oturum açmanız gerekiyor'); return false }
    const { data, error } = await supabase
      .from('kasa_entries')
      .insert({ ...values, user_id: user.id })
      .select('*')
      .single()
    if (error) { toast.error('Kayıt eklenemedi: ' + error.message); return false }
    toast.success('Kayıt eklendi')
    setEntries(prev => [data, ...prev])
    return true
  }

  const updateEntry = async (id: string, values: Partial<KasaEntry>) => {
    const previous = entries.find(e => e.id === id)
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...values } : e))
    const { error } = await supabase.from('kasa_entries').update(values).eq('id', id)
    if (error) {
      toast.error('Kayıt güncellenemedi: ' + error.message)
      if (previous) setEntries(prev => prev.map(e => e.id === id ? previous : e))
      return false
    }
    toast.success('Kayıt güncellendi')
    return true
  }

  const deleteEntry = async (id: string) => {
    const previous = entries.find(e => e.id === id)
    setEntries(prev => prev.filter(e => e.id !== id))
    const { error } = await supabase.from('kasa_entries').delete().eq('id', id)
    if (error) {
      toast.error('Kayıt silinemedi')
      if (previous) setEntries(prev => [previous, ...prev])
      return false
    }
    toast.success('Kayıt silindi')
    return true
  }

  const balance = entries.reduce((sum, e) => sum + (e.type === 'in' ? e.amount : -e.amount), 0)

  return { entries, loading, balance, createEntry, updateEntry, deleteEntry }
}
