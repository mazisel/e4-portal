'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useKanban } from '@/hooks/useKanban'
import { useAuth } from '@/contexts/AuthContext'
import {
  KanbanTask, KanbanStatus, KanbanPriority,
  KANBAN_STATUS_LABELS, KANBAN_STATUS_ORDER, KANBAN_PRIORITY_LABELS,
} from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Plus, MoreVertical, Pencil, Trash2, CalendarClock, ArrowRight,
  CircleDashed, Hourglass, CircleCheck, Search, User2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const selectClass =
  'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30'

const STATUS_META: Record<KanbanStatus, { icon: typeof CircleDashed; color: string; ring: string }> = {
  todo:        { icon: CircleDashed, color: 'text-slate-500',   ring: 'ring-slate-400/40' },
  in_progress: { icon: Hourglass,    color: 'text-blue-500',    ring: 'ring-blue-400/40' },
  done:        { icon: CircleCheck,  color: 'text-emerald-500', ring: 'ring-emerald-400/40' },
}

const PRIORITY_META: Record<KanbanPriority, string> = {
  high:   'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
  low:    'bg-slate-500/10 text-slate-500 border-slate-500/20',
}

const AVATAR_COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500']

function colorFromId(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function profileName(
  profile: { full_name: string | null; email: string | null } | null | undefined,
  fallbackEmail: string | null,
): string {
  if (profile?.full_name) return profile.full_name
  if (profile?.email) return profile.email.split('@')[0]
  if (fallbackEmail) return fallbackEmail.split('@')[0]
  return 'Bilinmeyen'
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '??'
  return parts.map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function formatDue(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

function isOverdue(dateStr: string, status: KanbanStatus): boolean {
  if (status === 'done') return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(dateStr + 'T00:00:00').getTime() < today.getTime()
}

interface FormState {
  title: string
  description: string
  assigneeId: string
  priority: KanbanPriority
  dueDate: string
}

const EMPTY_FORM: FormState = {
  title: '', description: '', assigneeId: '', priority: 'medium', dueDate: '',
}

export default function KanbanPage() {
  const { tasks, users, loading, fetchAll, addTask, updateTask, moveTask, deleteTask } = useKanban()
  const { user } = useAuth()

  const [query, setQuery] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState<'all' | 'me' | 'unassigned'>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | KanbanPriority>('all')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<KanbanStatus | null>(null)

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const activeUsers = useMemo(
    () => users.filter(u => u.is_active || u.id === user?.id),
    [users, user?.id],
  )

  const canManage = useCallback(
    (task: KanbanTask) => task.creator_id === user?.id || task.assignee_id === user?.id,
    [user?.id],
  )

  const filteredTasks = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('tr-TR')
    return tasks.filter(task => {
      if (assigneeFilter === 'me' && task.assignee_id !== user?.id) return false
      if (assigneeFilter === 'unassigned' && task.assignee_id) return false
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false
      if (!term) return true
      const searchable = [
        task.title,
        task.description ?? '',
        profileName(task.assignee, task.assignee_email),
        profileName(task.creator, task.creator_email),
      ].join(' ').toLocaleLowerCase('tr-TR')
      return searchable.includes(term)
    })
  }, [tasks, query, assigneeFilter, priorityFilter, user?.id])

  const columns = useMemo(
    () => KANBAN_STATUS_ORDER.map(status => ({
      status,
      items: filteredTasks.filter(t => t.status === status),
    })),
    [filteredTasks],
  )

  const openCreate = useCallback(() => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, assigneeId: user?.id ?? '' })
    setDialogOpen(true)
  }, [user?.id])

  const openEdit = useCallback((task: KanbanTask) => {
    setEditingId(task.id)
    setForm({
      title: task.title,
      description: task.description ?? '',
      assigneeId: task.assignee_id ?? '',
      priority: task.priority,
      dueDate: task.due_date ?? '',
    })
    setDialogOpen(true)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!form.title.trim()) return
    const input = {
      title: form.title,
      description: form.description,
      assigneeId: form.assigneeId || null,
      priority: form.priority,
      dueDate: form.dueDate || null,
    }
    if (editingId) {
      await updateTask(editingId, input)
    } else {
      await addTask(input)
    }
    setDialogOpen(false)
  }, [form, editingId, updateTask, addTask])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Bu görevi silmek istiyor musunuz?')) return
    await deleteTask(id)
  }, [deleteTask])

  const handleDrop = useCallback((status: KanbanStatus) => {
    setDragOverColumn(null)
    if (draggingId) moveTask(draggingId, status)
    setDraggingId(null)
  }, [draggingId, moveTask])

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Görev Panosu</h1>
          <p className="text-sm text-muted-foreground">
            Görevleri oluştur, ekibe ata ve durumlarını sürükleyerek güncelle.
          </p>
        </div>
        <Button onClick={openCreate} className="self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Yeni Görev
        </Button>
      </div>

      {/* Filtreler */}
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Başlık, kişi veya açıklama ara..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={assigneeFilter}
          onChange={e => setAssigneeFilter(e.target.value as typeof assigneeFilter)}
          className={cn(selectClass, 'sm:w-44')}
        >
          <option value="all">Herkes</option>
          <option value="me">Bana atananlar</option>
          <option value="unassigned">Atanmamış</option>
        </select>
        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value as typeof priorityFilter)}
          className={cn(selectClass, 'sm:w-40')}
        >
          <option value="all">Tüm öncelikler</option>
          <option value="high">Yüksek</option>
          <option value="medium">Orta</option>
          <option value="low">Düşük</option>
        </select>
      </div>

      {/* Pano */}
      <div className="grid gap-4 md:grid-cols-3">
        {columns.map(({ status, items }) => {
          const meta = STATUS_META[status]
          const Icon = meta.icon
          const isDropTarget = dragOverColumn === status

          return (
            <div
              key={status}
              onDragOver={e => { e.preventDefault(); setDragOverColumn(status) }}
              onDrop={() => handleDrop(status)}
              className={cn(
                'flex flex-col rounded-xl border bg-muted/30 transition-colors',
                isDropTarget && 'ring-2 bg-muted/60',
                isDropTarget && meta.ring,
              )}
            >
              <div className="flex items-center gap-2 px-3 py-2.5 border-b">
                <Icon className={cn('w-4 h-4', meta.color)} />
                <span className="text-sm font-semibold">{KANBAN_STATUS_LABELS[status]}</span>
                <Badge variant="secondary" className="ml-auto text-[11px]">{items.length}</Badge>
              </div>

              <div className="flex-1 space-y-2 p-2 min-h-[120px]">
                {loading ? (
                  <p className="text-center text-xs text-muted-foreground py-8">Yükleniyor...</p>
                ) : items.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-8">
                    {isDropTarget ? 'Buraya bırak' : 'Görev yok'}
                  </p>
                ) : (
                  items.map(task => {
                    const manageable = canManage(task)
                    const assigneeLabel = task.assignee_id
                      ? profileName(task.assignee, task.assignee_email)
                      : null
                    const overdue = task.due_date ? isOverdue(task.due_date, task.status) : false

                    return (
                      <div
                        key={task.id}
                        draggable={manageable}
                        onDragStart={() => manageable && setDraggingId(task.id)}
                        onDragEnd={() => { setDraggingId(null); setDragOverColumn(null) }}
                        className={cn(
                          'group rounded-lg border bg-card px-3 py-2.5 shadow-xs space-y-2',
                          manageable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
                          draggingId === task.id && 'opacity-40',
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <Badge variant="outline" className={cn('text-[10px]', PRIORITY_META[task.priority])}>
                            {KANBAN_PRIORITY_LABELS[task.priority]}
                          </Badge>
                          {task.due_date && (
                            <span className={cn(
                              'inline-flex items-center gap-1 text-[11px]',
                              overdue ? 'text-destructive font-medium' : 'text-muted-foreground',
                            )}>
                              <CalendarClock className="w-3 h-3" />
                              {formatDue(task.due_date)}
                            </span>
                          )}
                          {manageable && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="ml-auto -mr-1 p-1 rounded text-muted-foreground hover:bg-muted opacity-60 group-hover:opacity-100">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem onClick={() => openEdit(task)}>
                                  <Pencil className="w-4 h-4" />
                                  Düzenle
                                </DropdownMenuItem>
                                <DropdownMenuLabel className="text-[11px] text-muted-foreground">
                                  Taşı
                                </DropdownMenuLabel>
                                {KANBAN_STATUS_ORDER.filter(s => s !== task.status).map(s => (
                                  <DropdownMenuItem key={s} onClick={() => moveTask(task.id, s)}>
                                    <ArrowRight className="w-4 h-4" />
                                    {KANBAN_STATUS_LABELS[s]}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive" onClick={() => handleDelete(task.id)}>
                                  <Trash2 className="w-4 h-4" />
                                  Sil
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>

                        <p className="text-sm font-medium leading-snug break-words">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 break-words">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 pt-0.5">
                          {assigneeLabel ? (
                            <>
                              <span className={cn(
                                'w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0',
                                colorFromId(task.assignee_id!),
                              )}>
                                {initials(assigneeLabel)}
                              </span>
                              <span className="text-[11px] text-muted-foreground truncate">
                                {assigneeLabel}{task.assignee_id === user?.id ? ' (Ben)' : ''}
                              </span>
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              <User2 className="w-3.5 h-3.5" />
                              Atanmamış
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Oluştur / Düzenle */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Görevi Düzenle' : 'Yeni Görev'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="task-title">Başlık</Label>
              <Input
                id="task-title"
                placeholder="Görev başlığı"
                value={form.title}
                autoFocus
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-desc">Açıklama</Label>
              <textarea
                id="task-desc"
                placeholder="Detay (opsiyonel)"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                className={cn(selectClass, 'h-auto py-2 resize-y')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-assignee">Atanan kişi</Label>
              <select
                id="task-assignee"
                value={form.assigneeId}
                onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value }))}
                className={selectClass}
              >
                <option value="">Atanmamış</option>
                {activeUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {profileName(u, u.email)}{u.id === user?.id ? ' (Ben)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="task-priority">Öncelik</Label>
                <select
                  id="task-priority"
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value as KanbanPriority }))}
                  className={selectClass}
                >
                  <option value="high">Yüksek</option>
                  <option value="medium">Orta</option>
                  <option value="low">Düşük</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-due">Bitiş tarihi</Label>
                <Input
                  id="task-due"
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Vazgeç</Button>
            <Button onClick={handleSubmit} disabled={!form.title.trim()}>
              {editingId ? 'Kaydet' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
