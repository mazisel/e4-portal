'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

export interface CalendarPlan {
  id: string
  user_id: string
  week_start: string
  day_of_week: number
  hour: number
  title: string
  description: string | null
}

export function useCalendar() {
  const [plans, setPlans] = useState<CalendarPlan[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const fetchWeek = useCallback(async (weekStart: string) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('calendar_plans')
      .select('*')
      .eq('week_start', weekStart)
      .order('day_of_week')
      .order('hour')
    if (error) {
      toast.error('Takvim yüklenemedi')
    } else {
      setPlans(data ?? [])
    }
    setLoading(false)
  }, [])

  const upsertPlan = useCallback(async (
    weekStart: string,
    dayOfWeek: number,
    hour: number,
    title: string,
    description: string
  ) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('calendar_plans')
      .upsert(
        { user_id: user.id, user_email: user.email, week_start: weekStart, day_of_week: dayOfWeek, hour, title, description },
        { onConflict: 'user_id,week_start,day_of_week,hour' }
      )
      .select()
      .single()

    if (error) {
      toast.error('Plan kaydedilemedi')
      return
    }
    setPlans(prev => {
      const filtered = prev.filter(
        p => !(p.week_start === weekStart && p.day_of_week === dayOfWeek && p.hour === hour)
      )
      return [...filtered, data as CalendarPlan]
    })
    toast.success('Plan kaydedildi')
  }, [])

  const deletePlan = useCallback(async (id: string) => {
    const { error } = await supabase.from('calendar_plans').delete().eq('id', id)
    if (error) {
      toast.error('Plan silinemedi')
      return
    }
    setPlans(prev => prev.filter(p => p.id !== id))
    toast.success('Plan silindi')
  }, [])

  return { plans, loading, fetchWeek, upsertPlan, deletePlan }
}
