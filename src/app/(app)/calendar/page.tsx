'use client'

import { useState, useEffect, useCallback, useRef, Fragment } from 'react'
import { useCalendar, CalendarPlan } from '@/hooks/useCalendar'
import { ChevronLeft, ChevronRight, X, Check, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7) // 07:00 - 22:00

function getMondayOf(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatWeekStart(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatHour(h: number): string {
  return `${String(h).padStart(2, '0')}:00`
}

function displayName(email: string | null, fullName: string | null): string {
  if (fullName) return fullName
  if (email) return email.split('@')[0]
  return '?'
}

interface EditingState {
  day: number
  startHour: number
  endHour: number // inclusive
  plan?: CalendarPlan
}

interface CellEditorProps {
  editing: EditingState
  onSave: (title: string, description: string) => void
  onDelete: () => void
  onClose: () => void
}

function CellEditor({ editing, onSave, onDelete, onClose }: CellEditorProps) {
  const [title, setTitle] = useState(editing.plan?.title ?? '')
  const [desc, setDesc] = useState(editing.plan?.description ?? '')

  const timeLabel = editing.endHour > editing.startHour
    ? `${formatHour(editing.startHour)} – ${formatHour(editing.endHour + 1)}`
    : formatHour(editing.startHour)

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs text-muted-foreground font-medium">{timeLabel}</div>
      <input
        autoFocus
        className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder="Plan başlığı"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && title.trim()) onSave(title.trim(), desc)
          if (e.key === 'Escape') onClose()
        }}
      />
      <textarea
        className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        placeholder="Açıklama (opsiyonel)"
        rows={2}
        value={desc}
        onChange={e => setDesc(e.target.value)}
      />
      <div className="flex gap-1 justify-end">
        {editing.plan && (
          <button onClick={onDelete} className="text-destructive hover:underline text-xs">Sil</button>
        )}
        <button onClick={onClose} className="p-1 rounded hover:bg-muted">
          <X className="w-3 h-3" />
        </button>
        <button
          onClick={() => title.trim() && onSave(title.trim(), desc)}
          className="p-1 rounded bg-primary text-primary-foreground hover:opacity-90"
        >
          <Check className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOf(new Date()))
  const [editing, setEditing] = useState<EditingState | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [dragState, setDragState] = useState<{ day: number; startHour: number; endHour: number } | null>(null)
  const isDragging = useRef(false)

  const { plans, users, currentUserId, loading, fetchUsers, fetchWeek, savePlan, deletePlan } = useCalendar()

  const weekKey = formatWeekStart(weekStart)
  const isOwnCalendar = selectedUserId === currentUserId

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    if (currentUserId && !selectedUserId) {
      setSelectedUserId(currentUserId)
    }
  }, [currentUserId, selectedUserId])

  useEffect(() => {
    if (selectedUserId) fetchWeek(weekKey, selectedUserId)
  }, [weekKey, selectedUserId, fetchWeek])

  // Sürükleme bırakma global olarak yakala
  useEffect(() => {
    const handleMouseUp = () => {
      if (!isDragging.current || !dragState) return
      isDragging.current = false
      const startH = Math.min(dragState.startHour, dragState.endHour)
      const endH = Math.max(dragState.startHour, dragState.endHour)
      // Eğer seçilen aralıkta tek bir mevcut plan varsa onu düzenlemeye aç
      const existingPlan = plans.find(p =>
        p.day_of_week === dragState.day && p.hour === startH && p.hour_end === endH + 1
      )
      setEditing({ day: dragState.day, startHour: startH, endHour: endH, plan: existingPlan })
      setDragState(null)
    }
    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [dragState, plans])

  const getCellInfo = useCallback((day: number, hour: number): { planStart?: CalendarPlan; planCover?: CalendarPlan } => {
    for (const plan of plans) {
      if (plan.day_of_week !== day) continue
      if (plan.hour === hour) return { planStart: plan }
      if (hour > plan.hour && hour < plan.hour_end) return { planCover: plan }
    }
    return {}
  }, [plans])

  const isDragHighlighted = (day: number, hour: number): boolean => {
    if (!dragState || dragState.day !== day) return false
    const minH = Math.min(dragState.startHour, dragState.endHour)
    const maxH = Math.max(dragState.startHour, dragState.endHour)
    return hour >= minH && hour <= maxH
  }

  const handleCellMouseDown = (day: number, hour: number) => {
    if (!isOwnCalendar) return
    isDragging.current = true
    setDragState({ day, startHour: hour, endHour: hour })
    setEditing(null)
  }

  const handleCellMouseEnter = (day: number, hour: number) => {
    if (!isDragging.current || !dragState || dragState.day !== day) return
    setDragState(prev => prev ? { ...prev, endHour: hour } : null)
  }

  const handlePlanClick = (e: React.MouseEvent, plan: CalendarPlan) => {
    if (!isOwnCalendar) return
    e.stopPropagation()
    if (isDragging.current) return
    setEditing({ day: plan.day_of_week, startHour: plan.hour, endHour: plan.hour_end - 1, plan })
  }

  const prevWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })
  const nextWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })
  const goToday = () => setWeekStart(getMondayOf(new Date()))

  const weekLabel = (() => {
    const end = new Date(weekStart)
    end.setDate(end.getDate() + 6)
    const fmt = (d: Date) => d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
    return `${fmt(weekStart)} – ${fmt(end)}, ${weekStart.getFullYear()}`
  })()

  const isCurrentWeek = weekKey === formatWeekStart(getMondayOf(new Date()))

  const handleSave = async (title: string, desc: string) => {
    if (!editing) return
    await savePlan(weekKey, editing.day, editing.startHour, editing.endHour + 1, title, desc)
    setEditing(null)
  }

  const handleDelete = async () => {
    if (!editing?.plan) return
    await deletePlan(editing.plan.id)
    setEditing(null)
  }

  const selectedUser = users.find(u => u.id === selectedUserId)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Takvim</h1>
          <p className="text-sm text-muted-foreground">{weekLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          {!isCurrentWeek && (
            <Button variant="outline" size="sm" onClick={goToday}>Bu hafta</Button>
          )}
          <Button variant="outline" size="icon" onClick={prevWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Kişi seçici */}
      <div className="flex flex-wrap gap-2">
        {users.map(u => {
          const isSelected = selectedUserId === u.id
          const isMe = u.id === currentUserId
          return (
            <button
              key={u.id}
              onClick={() => { setSelectedUserId(u.id); setEditing(null) }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card hover:bg-muted border-border text-muted-foreground'
              )}
            >
              <User className="w-3.5 h-3.5" />
              {displayName(u.email, u.full_name)}
              {isMe && <span className="text-xs opacity-70">(Ben)</span>}
            </button>
          )
        })}
      </div>

      {/* Sadece okuma uyarısı */}
      {!isOwnCalendar && selectedUser && (
        <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          <strong>{displayName(selectedUser.email, selectedUser.full_name)}</strong> adlı kişinin takvimini görüntülüyorsunuz — sadece okuma modunda.
        </div>
      )}

      {/* Grid */}
      <div className="overflow-auto border rounded-lg bg-card select-none">
        <div
          className="grid min-w-[700px]"
          style={{ gridTemplateColumns: '64px repeat(7, 1fr)' }}
        >
          {/* Header row */}
          <div className="border-b border-r px-2 py-2 text-xs text-muted-foreground" />
          {DAYS.map((day, i) => {
            const dayDate = new Date(weekStart)
            dayDate.setDate(dayDate.getDate() + i)
            const isToday = dayDate.toDateString() === new Date().toDateString()
            return (
              <div
                key={day}
                className={cn(
                  'border-b border-r px-2 py-2 text-center text-xs font-medium',
                  isToday && 'bg-primary/10 text-primary'
                )}
              >
                <div>{day}</div>
                <div className="text-muted-foreground font-normal">
                  {dayDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            )
          })}

          {loading ? (
            <div className="col-span-8 py-12 text-center text-sm text-muted-foreground">Yükleniyor...</div>
          ) : (
            HOURS.map(hour => (
              <Fragment key={hour}>
                <div className="border-b border-r px-2 py-1 text-xs text-muted-foreground text-right pr-3 leading-8">
                  {formatHour(hour)}
                </div>
                {DAYS.map((_, dayIdx) => {
                  const day = dayIdx + 1
                  const { planStart, planCover } = getCellInfo(day, hour)
                  const plan = planStart ?? planCover
                  const highlighted = isDragHighlighted(day, hour)
                  const isEditingHere = editing?.day === day && editing?.startHour === hour && !planCover

                  return (
                    <div
                      key={`${day}-${hour}`}
                      className={cn(
                        'border-b border-r min-h-[40px] p-1 transition-colors',
                        isOwnCalendar ? 'cursor-pointer' : 'cursor-default',
                        planStart && (isOwnCalendar
                          ? 'bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                          : 'bg-muted/60'),
                        planCover && (isOwnCalendar
                          ? 'bg-blue-50/60 dark:bg-blue-950/20'
                          : 'bg-muted/40'),
                        highlighted && !plan && 'bg-primary/20',
                        highlighted && planCover && 'bg-primary/30',
                        highlighted && planStart && 'ring-1 ring-inset ring-primary/40',
                      )}
                      onMouseDown={() => {
                        if (planCover && plan) {
                          // Kaplı hücreye tıklanırsa planın başına git
                          if (!isDragging.current) {
                            setEditing({ day: plan.day_of_week, startHour: plan.hour, endHour: plan.hour_end - 1, plan })
                          }
                          return
                        }
                        handleCellMouseDown(day, hour)
                      }}
                      onMouseEnter={() => handleCellMouseEnter(day, hour)}
                    >
                      {isEditingHere && isOwnCalendar ? (
                        <CellEditor
                          editing={editing!}
                          onSave={handleSave}
                          onDelete={handleDelete}
                          onClose={() => setEditing(null)}
                        />
                      ) : planStart ? (
                        <div
                          className="text-xs cursor-pointer"
                          onClick={(e) => handlePlanClick(e, planStart)}
                        >
                          <div className={cn(
                            'font-medium truncate',
                            isOwnCalendar ? 'text-blue-700 dark:text-blue-300' : 'text-foreground/80'
                          )}>
                            {planStart.title}
                          </div>
                          {planStart.hour_end - planStart.hour > 1 ? (
                            <div className="text-muted-foreground">
                              {formatHour(planStart.hour)}–{formatHour(planStart.hour_end)}
                            </div>
                          ) : planStart.description ? (
                            <div className="text-muted-foreground truncate">{planStart.description}</div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </Fragment>
            ))
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {isOwnCalendar
          ? 'Tek saat için tıklayın, birden fazla saat için sürükleyin.'
          : 'Kendi takviminizi düzenlemek için üstten adınızı seçin.'}
      </p>
    </div>
  )
}
