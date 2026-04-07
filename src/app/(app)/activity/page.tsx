'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useActivity, ActivityLog } from '@/hooks/useActivity'
import { useAuth } from '@/contexts/AuthContext'
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Clock, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const DURATION_OPTIONS = [
  { label: '30 dk', value: 30 },
  { label: '1 saat', value: 60 },
  { label: '1.5 saat', value: 90 },
  { label: '2 saat', value: 120 },
  { label: '2.5 saat', value: 150 },
  { label: '3 saat', value: 180 },
  { label: '4 saat', value: 240 },
  { label: '5 saat', value: 300 },
  { label: '6 saat', value: 360 },
  { label: '7 saat', value: 420 },
  { label: '8 saat', value: 480 },
]

const MIN_DURATION_OPTIONS = [
  { label: 'Hepsi', value: 0 },
  { label: 'En az 1 saat', value: 60 },
  { label: 'En az 2 saat', value: 120 },
  { label: 'En az 3 saat', value: 180 },
]

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} dk`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}s ${m}dk` : `${h} saat`
}

function formatTime(dateTimeStr: string): string {
  const d = new Date(dateTimeStr)
  if (Number.isNaN(d.getTime())) return '--:--'
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function fromDateKey(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function todayStr(): string {
  return toDateKey(new Date())
}

function shiftDate(dateStr: string, delta: number): string {
  const dt = fromDateKey(dateStr)
  dt.setDate(dt.getDate() + delta)
  return toDateKey(dt)
}

function getWeekDays(dateStr: string): string[] {
  const selected = fromDateKey(dateStr)
  const mondayOffset = (selected.getDay() + 6) % 7
  selected.setDate(selected.getDate() - mondayOffset)

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(selected)
    day.setDate(selected.getDate() + index)
    return toDateKey(day)
  })
}

function getWeekStart(date: Date): Date {
  const weekStart = new Date(date)
  const mondayOffset = (weekStart.getDay() + 6) % 7
  weekStart.setDate(weekStart.getDate() - mondayOffset)
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
}

function isLockedWeek(dateStr: string): boolean {
  return getWeekStart(fromDateKey(dateStr)).getTime() < getWeekStart(new Date()).getTime()
}

function displayName(log: ActivityLog): string {
  if (log.profile?.full_name) return log.profile.full_name
  if (log.profile?.email) return log.profile.email.split('@')[0]
  if (log.user_email) return log.user_email.split('@')[0]
  return 'Bilinmeyen'
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '??'
  return parts.map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function ActivityPage() {
  const [date, setDate] = useState(todayStr)
  const [quickTitle, setQuickTitle] = useState('')
  const [quickDuration, setQuickDuration] = useState(60)
  const [quickDesc, setQuickDesc] = useState('')
  const [ownerFilter, setOwnerFilter] = useState<'all' | 'me'>('all')
  const [minDuration, setMinDuration] = useState(0)
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDuration, setEditDuration] = useState(60)
  const [editDesc, setEditDesc] = useState('')
  const { logs, loading, fetchDay, addLog, updateLog, deleteLog } = useActivity()
  const { user } = useAuth()

  useEffect(() => {
    fetchDay(date)
  }, [date, fetchDay])

  const changeDate = useCallback((nextDate: string) => {
    setEditingId(null)
    setDate(nextDate)
  }, [])

  const prevWeek = () => setDate(d => {
    setEditingId(null)
    return shiftDate(d, -7)
  })
  const nextWeek = () => setDate(d => {
    setEditingId(null)
    return shiftDate(d, 7)
  })

  const today = todayStr()
  const isToday = date === today
  const weekDays = useMemo(() => getWeekDays(date), [date])
  const weekIsLocked = useMemo(() => isLockedWeek(date), [date])

  const sortedLogs = useMemo(() => (
    [...logs].sort((a, b) => (
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ))
  ), [logs])

  const filteredLogs = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('tr-TR')
    return sortedLogs.filter(log => {
      if (ownerFilter === 'me' && log.user_id !== user?.id) return false
      if (log.duration_minutes < minDuration) return false
      if (!term) return true

      const searchable = `${log.title} ${log.description ?? ''} ${displayName(log)}`
        .toLocaleLowerCase('tr-TR')
      return searchable.includes(term)
    })
  }, [sortedLogs, ownerFilter, user?.id, minDuration, query])

  const totalMinutes = useMemo(
    () => logs.reduce((sum, log) => sum + log.duration_minutes, 0),
    [logs]
  )
  const totalUsers = useMemo(
    () => new Set(logs.map(log => log.user_id)).size,
    [logs]
  )
  const longestLog = useMemo(() => {
    if (logs.length === 0) return null
    return logs.reduce((longest, log) => (
      log.duration_minutes > longest.duration_minutes ? log : longest
    ))
  }, [logs])

  const userColors = useMemo<Record<string, string>>(() => {
    const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500']
    const ids = Array.from(new Set(logs.map(log => log.user_id)))
    return Object.fromEntries(ids.map((uid, index) => [uid, colors[index % colors.length]]))
  }, [logs])

  const handleQuickAdd = useCallback(async () => {
    if (weekIsLocked) return

    const title = quickTitle.trim()
    if (!title) return

    await addLog(date, quickDuration, title, quickDesc.trim())
    setQuickTitle('')
    setQuickDesc('')
  }, [addLog, date, quickDuration, quickDesc, quickTitle, weekIsLocked])

  const handleStartEdit = useCallback((log: ActivityLog) => {
    if (weekIsLocked) return

    setEditingId(log.id)
    setEditTitle(log.title)
    setEditDuration(log.duration_minutes)
    setEditDesc(log.description ?? '')
  }, [weekIsLocked])

  const handleCancelEdit = useCallback(() => {
    setEditingId(null)
  }, [])

  const handleSaveEdit = useCallback(async () => {
    if (weekIsLocked || !editingId) return

    const title = editTitle.trim()
    if (!title) return

    await updateLog(editingId, editDuration, title, editDesc.trim())
    setEditingId(null)
  }, [editingId, editTitle, editDuration, editDesc, updateLog, weekIsLocked])

  const handleDelete = useCallback(async (id: string) => {
    if (weekIsLocked) return

    if (!confirm('Bu aktiviteyi silmek istiyor musunuz?')) return
    await deleteLog(id)
  }, [deleteLog, weekIsLocked])

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Aktivite</h1>
          <p className="text-sm text-muted-foreground">{formatDate(date)}</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!isToday && (
            <Button variant="outline" size="sm" onClick={() => changeDate(today)}>Bugün</Button>
          )}
          <Button variant="outline" size="icon" onClick={prevWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="py-4">
        <CardContent className="px-4">
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map(dayKey => {
              const dayDate = fromDateKey(dayKey)
              const active = dayKey === date
              const isDayToday = dayKey === today

              return (
                <button
                  key={dayKey}
                  onClick={() => changeDate(dayKey)}
                  className={cn(
                    'rounded-lg border px-2 py-2 text-left transition-colors',
                    active
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:bg-muted/50'
                  )}
                >
                  <span className="block text-[11px] uppercase text-muted-foreground">
                    {dayDate.toLocaleDateString('tr-TR', { weekday: 'short' })}
                  </span>
                  <span className="block text-base font-semibold">{dayDate.getDate()}</span>
                  <span className="block h-4 text-[11px] text-muted-foreground">
                    {isDayToday ? 'Bugün' : ''}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="py-4">
          <CardContent className="px-4">
            <p className="text-xs text-muted-foreground">Toplam Süre</p>
            <p className="text-xl font-semibold mt-1">{formatDuration(totalMinutes)}</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <p className="text-xs text-muted-foreground">Katılan Kişi</p>
            <p className="text-xl font-semibold mt-1">{totalUsers}</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <p className="text-xs text-muted-foreground">En Uzun Aktivite</p>
            <p className="text-base font-semibold mt-1">
              {longestLog ? formatDuration(longestLog.duration_minutes) : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="py-4">
        <CardContent className="px-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Hızlı Aktivite Ekle</h2>
            <div className="flex items-center gap-2">
              {weekIsLocked && (
                <Badge variant="destructive" className="text-[11px]">Hafta Kilitli</Badge>
              )}
              <Badge variant="outline" className="text-[11px]">{formatDate(date)}</Badge>
            </div>
          </div>
          {weekIsLocked && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-muted-foreground">
              Seçili gün geçmiş bir haftaya ait olduğu için ekleme, düzenleme ve silme kapatıldı.
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-[1fr_150px_auto]">
            <Input
              placeholder="Bugün ne yaptın?"
              value={quickTitle}
              disabled={weekIsLocked}
              onChange={e => setQuickTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && quickTitle.trim()) handleQuickAdd()
              }}
            />
            <select
              value={quickDuration}
              disabled={weekIsLocked}
              onChange={e => setQuickDuration(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
            >
              {DURATION_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button onClick={handleQuickAdd} disabled={weekIsLocked || !quickTitle.trim()}>
              <Plus className="w-4 h-4" />
              Ekle
            </Button>
          </div>
          <Input
            placeholder="Not (opsiyonel)"
            value={quickDesc}
            disabled={weekIsLocked}
            onChange={e => setQuickDesc(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardContent className="px-4 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-semibold">Aktivite Akışı</h2>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={ownerFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setOwnerFilter('all')}
              >
                Tümü
              </Button>
              <Button
                size="sm"
                variant={ownerFilter === 'me' ? 'default' : 'outline'}
                onClick={() => setOwnerFilter('me')}
              >
                Benim
              </Button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-[1fr_170px]">
            <Input
              placeholder="Başlık, açıklama veya kullanıcı ara..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <select
              value={minDuration}
              onChange={e => setMinDuration(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
            >
              {MIN_DURATION_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center text-sm text-muted-foreground py-12">Yükleniyor...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Bu gün için henüz aktivite girilmemiş.</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              Seçili filtrelere uyan aktivite yok.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map(log => {
                const isMe = log.user_id === user?.id
                const name = displayName(log)
                const isEditing = editingId === log.id
                const canManageLog = isMe && !weekIsLocked

                return (
                  <div key={log.id} className="rounded-xl border bg-card px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0',
                          userColors[log.user_id] ?? 'bg-slate-500'
                        )}
                      >
                        {initials(name)}
                      </div>

                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                            {formatTime(log.created_at)}
                          </span>
                          <Badge variant="secondary" className="text-[11px]">
                            {name}{isMe ? ' (Ben)' : ''}
                          </Badge>
                          <Badge variant="outline" className="text-[11px]">
                            {formatDuration(log.duration_minutes)}
                          </Badge>
                        </div>

                        {isEditing ? (
                          <div className="space-y-2">
                            <Input
                              value={editTitle}
                              onChange={e => setEditTitle(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && editTitle.trim()) handleSaveEdit()
                                if (e.key === 'Escape') handleCancelEdit()
                              }}
                            />
                            <div className="grid gap-2 sm:grid-cols-[150px_1fr]">
                              <select
                                value={editDuration}
                                onChange={e => setEditDuration(Number(e.target.value))}
                                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
                              >
                                {DURATION_OPTIONS.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              <Input
                                placeholder="Not (opsiyonel)"
                                value={editDesc}
                                onChange={e => setEditDesc(e.target.value)}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                <X className="w-3.5 h-3.5" />
                                Vazgeç
                              </Button>
                              <Button size="sm" onClick={handleSaveEdit} disabled={!editTitle.trim()}>
                                <Check className="w-3.5 h-3.5" />
                                Kaydet
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm font-medium break-words">{log.title}</p>
                            {log.description && (
                              <p className="text-xs text-muted-foreground mt-1 break-words">{log.description}</p>
                            )}
                          </div>
                        )}
                      </div>

                      {canManageLog && !isEditing && (
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => handleStartEdit(log)}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(log.id)}
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
