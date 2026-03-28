'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { KasaEntry } from '@/types'
import { toast } from 'sonner'

export function useKasa() {
  const [entries, setEntries] = useState<KasaEntry[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('kasa_entries')
      .select('*')
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false })
    if (!error && data) setEntries(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const createEntry = async (values: Omit<KasaEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Oturum açmanız gerekiyor'); return false }
    const { error } = await supabase.from('kasa_entries').insert({ ...values, user_id: user.id })
    if (error) { toast.error('Kayıt eklenemedi: ' + error.message); return false }
    toast.success('Kayıt eklendi')
    await fetchEntries()
    return true
  }

  const updateEntry = async (id: string, values: Partial<KasaEntry>) => {
    const { error } = await supabase.from('kasa_entries').update(values).eq('id', id)
    if (error) { toast.error('Kayıt güncellenemedi: ' + error.message); return false }
    toast.success('Kayıt güncellendi')
    await fetchEntries()
    return true
  }

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from('kasa_entries').delete().eq('id', id)
    if (error) { toast.error('Kayıt silinemedi'); return false }
    toast.success('Kayıt silindi')
    await fetchEntries()
    return true
  }

  const balance = entries.reduce((sum, e) => sum + (e.type === 'in' ? e.amount : -e.amount), 0)

  return { entries, loading, balance, createEntry, updateEntry, deleteEntry }
}
