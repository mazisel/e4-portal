'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { KanbanTask, KanbanStatus, KanbanPriority } from '@/types'

export interface KanbanUser {
  id: string
  full_name: string | null
  email: string | null
  is_active: boolean
}

export interface TaskInput {
  title: string
  description: string
  assigneeId: string | null
  priority: KanbanPriority
  dueDate: string | null
}

type ProfileRow = {
  id: string
  full_name: string | null
  email: string | null
  is_active: boolean
}

export function useKanban() {
  const [tasks, setTasks] = useState<KanbanTask[]>([])
  const [users, setUsers] = useState<KanbanUser[]>([])
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient())

  const enrich = useCallback((task: KanbanTask, profileMap: Record<string, ProfileRow>): KanbanTask => ({
    ...task,
    creator: profileMap[task.creator_id] ?? null,
    assignee: task.assignee_id ? profileMap[task.assignee_id] ?? null : null,
  }), [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [{ data: tasksData, error }, { data: profilesData }] = await Promise.all([
      supabase
        .from('kanban_tasks')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('id, full_name, email, is_active')
        .order('full_name'),
    ])

    if (error) {
      toast.error('Görevler yüklenemedi')
    } else {
      const profiles = (profilesData ?? []) as ProfileRow[]
      const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]))
      setTasks((tasksData ?? []).map(t => enrich(t as KanbanTask, profileMap)))
      setUsers(profiles)
    }
    setLoading(false)
  }, [supabase, enrich])

  const addTask = useCallback(async (input: TaskInput) => {
    const title = input.title.trim()
    if (!title) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const assignee = input.assigneeId ? users.find(u => u.id === input.assigneeId) ?? null : null

    const { data, error } = await supabase
      .from('kanban_tasks')
      .insert({
        creator_id: user.id,
        creator_email: user.email,
        assignee_id: input.assigneeId,
        assignee_email: assignee?.email ?? null,
        title,
        description: input.description.trim() || null,
        status: 'todo',
        priority: input.priority,
        due_date: input.dueDate,
      })
      .select('*')
      .single()

    if (error) {
      console.error('addTask error:', error)
      toast.error('Görev oluşturulamadı')
      return
    }

    const profileMap = Object.fromEntries(users.map(u => [u.id, u]))
    setTasks(prev => [enrich(data as KanbanTask, profileMap), ...prev])
    toast.success('Görev oluşturuldu')
  }, [supabase, users, enrich])

  const updateTask = useCallback(async (id: string, input: TaskInput) => {
    const title = input.title.trim()
    if (!title) return

    const assignee = input.assigneeId ? users.find(u => u.id === input.assigneeId) ?? null : null

    const { data, error } = await supabase
      .from('kanban_tasks')
      .update({
        assignee_id: input.assigneeId,
        assignee_email: assignee?.email ?? null,
        title,
        description: input.description.trim() || null,
        priority: input.priority,
        due_date: input.dueDate,
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('updateTask error:', error)
      toast.error('Görev güncellenemedi')
      return
    }

    const profileMap = Object.fromEntries(users.map(u => [u.id, u]))
    setTasks(prev => prev.map(t => t.id === id ? enrich(data as KanbanTask, profileMap) : t))
    toast.success('Görev güncellendi')
  }, [supabase, users, enrich])

  const moveTask = useCallback(async (id: string, status: KanbanStatus) => {
    const current = tasks.find(t => t.id === id)
    if (!current || current.status === status) return

    // İyimser güncelleme
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))

    const { error } = await supabase
      .from('kanban_tasks')
      .update({ status })
      .eq('id', id)

    if (error) {
      console.error('moveTask error:', error)
      toast.error('Görev taşınamadı')
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: current.status } : t))
    }
  }, [supabase, tasks])

  const deleteTask = useCallback(async (id: string) => {
    const { error } = await supabase.from('kanban_tasks').delete().eq('id', id)
    if (error) {
      toast.error('Görev silinemedi')
      return
    }
    setTasks(prev => prev.filter(t => t.id !== id))
    toast.success('Görev silindi')
  }, [supabase])

  return { tasks, users, loading, fetchAll, addTask, updateTask, moveTask, deleteTask }
}
