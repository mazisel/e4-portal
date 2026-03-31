'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

export interface ActivityLog {
  id: string
  user_id: string
  user_email: string | null
  date: string
  duration_minutes: number
  title: string
  description: string | null
  created_at: string
  profile?: {
    full_name: string | null
    email: string | null
  }
}

export function useActivity() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const fetchDay = useCallback(async (date: string) => {
    setLoading(true)
    const [{ data: logsData, error }, { data: profilesData }] = await Promise.all([
      supabase
        .from('activity_logs')
        .select('*')
        .eq('date', date)
        .order('created_at', { ascending: true }),
      supabase
        .from('profiles')
        .select('id, full_name, email'),
    ])
    if (error) {
      toast.error('Aktiviteler yüklenemedi')
    } else {
      const profileMap = Object.fromEntries((profilesData ?? []).map(p => [p.id, p]))
      const merged = (logsData ?? []).map(l => ({
        ...l,
        profile: profileMap[l.user_id] ?? null,
      }))
      setLogs(merged as ActivityLog[])
    }
    setLoading(false)
  }, [])

  const addLog = useCallback(async (
    date: string,
    durationMinutes: number,
    title: string,
    description: string
  ) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        user_email: user.email,
        date,
        duration_minutes: durationMinutes,
        title,
        description: description || null,
      })
      .select('*')
      .single()

    if (error) {
      console.error('addLog error:', error)
      toast.error('Aktivite kaydedilemedi')
      return
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', user.id)
      .single()
    setLogs(prev => [...prev, { ...data, profile } as ActivityLog])
    toast.success('Aktivite kaydedildi')
  }, [])

  const updateLog = useCallback(async (
    id: string,
    durationMinutes: number,
    title: string,
    description: string
  ) => {
    const { data, error } = await supabase
      .from('activity_logs')
      .update({ duration_minutes: durationMinutes, title, description: description || null })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      toast.error('Aktivite güncellenemedi')
      return
    }
    setLogs(prev => prev.map(l => l.id === id ? { ...data, profile: l.profile } as ActivityLog : l))
    toast.success('Aktivite güncellendi')
  }, [])

  const deleteLog = useCallback(async (id: string) => {
    const { error } = await supabase.from('activity_logs').delete().eq('id', id)
    if (error) { toast.error('Aktivite silinemedi'); return }
    setLogs(prev => prev.filter(l => l.id !== id))
    toast.success('Aktivite silindi')
  }, [])

  return { logs, loading, fetchDay, addLog, updateLog, deleteLog }
}
