'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'
import { useCalendar, CalendarPlan } from '@/hooks/useCalendar'
import { ChevronLeft, ChevronRight, X, Check, User, Plus } from 'lucide-react'
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

interface ModalState {
  day: number
  dayLabel: string
  selectedHours: Set<number>
  title: string
  description: string
  existingPlan?: CalendarPlan
}

interface PlanModalProps {
  state: ModalState
  occupiedHours: Set<number>
  onClose: () => void
  onSave: (selectedHours: Set<number>, title: string, description: string) => void
  onDelete: () => void
}

function PlanModal({ state, occupiedHours, onClose, onSave, onDelete }: PlanModalProps) {
  const [selectedHours, setSelectedHours] = useState<Set<number>>(new Set(state.selectedHours))
  const [title, setTitle] = useState(state.title)
  const [desc, setDesc] = useState(state.description)

  const toggleHour = (h: number) => {
    if (occupiedHours.has(h)) return
    setSelectedHours(prev => {
      const next = new Set(prev)
      if (next.has(h)) next.delete(h)
      else next.add(h)
      return next
    })
  }

  const minH = selectedHours.size > 0 ? Math.min(...selectedHours) : null
  const maxH = selectedHours.size > 0 ? Math.max(...selectedHours) : null
  const timeRange = minH !== null && maxH !== null
    ? minH === maxH ? formatHour(minH) : `${formatHour(minH)} – ${formatHour(maxH + 1)}`
    : null

  const canSave = selectedHours.size > 0 && title.trim().length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-card border rounded-xl shadow-xl w-full max-w-sm mx-4 p-5 flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Başlık */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-semibold text-sm">{state.existingPlan ? 'Planı Düzenle' : 'Plan Ekle'}</h2>
            <p className="text-xs text-muted-foreground">{state.dayLabel}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Saat seçici */}
        <div>
          <p className="text-xs font-medium mb-2 text-muted-foreground">
            Saat seç {timeRange && <span className="text-foreground">— {timeRange}</span>}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {HOURS.map(h => {
              const isSelected = selectedHours.has(h)
              const isOccupied = occupiedHours.has(h)
              return (
                <button
                  key={h}
                  onClick={() => toggleHour(h)}
                  disabled={isOccupied}
                  className={cn(
                    'px-2 py-0.5 rounded text-xs font-mono transition-colors border',
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : isOccupied
                        ? 'bg-muted/40 text-muted-foreground/40 border-border/40 cursor-not-allowed'
                        : 'bg-muted text-muted-foreground border-border hover:bg-muted/70'
                  )}
                >
                  {formatHour(h)}
                </button>
              )
            })}
          </div>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-2">
          <input
            autoFocus
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Plan başlığı *"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && canSave) onSave(selectedHours, title.trim(), desc)
              if (e.key === 'Escape') onClose()
            }}
          />
          <textarea
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="Açıklama (opsiyonel)"
            rows={2}
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
        </div>

        {/* Butonlar */}
        <div className="flex items-center justify-between gap-2">
          {state.existingPlan ? (
            <button
              onClick={onDelete}
              className="text-xs text-destructive hover:underline"
            >
              Sil
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>İptal</Button>
            <Button size="sm" disabled={!canSave} onClick={() => onSave(selectedHours, title.trim(), desc)}>
              <Check className="w-3.5 h-3.5 mr-1" />
              Kaydet
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOf(new Date()))
  const [modal, setModal] = useState<ModalState | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const { plans, users, currentUserId, loading, fetchUsers, fetchWeek, savePlan, deletePlan } = useCalendar()

  const weekKey = formatWeekStart(weekStart)
  const isOwnCalendar = selectedUserId === currentUserId

  useEffect(() => { fetchUsers() }, [fetchUsers])

  useEffect(() => {
    if (currentUserId && !selectedUserId) setSelectedUserId(currentUserId)
  }, [currentUserId, selectedUserId])

  useEffect(() => {
    if (selectedUserId) fetchWeek(weekKey, selectedUserId)
  }, [weekKey, selectedUserId, fetchWeek])

  const getCellInfo = useCallback((day: number, hour: number) => {
    for (const plan of plans) {
      if (plan.day_of_week !== day) continue
      if (plan.hour === hour) return { planStart: plan }
      if (hour > plan.hour && hour < plan.hour_end) return { planCover: plan }
    }
    return {}
  }, [plans])

  // Belirli bir günde başka planların kapladığı saatler (modal açıkken kullanılır)
  const getOccupiedHours = useCallback((day: number, excludePlanId?: string): Set<number> => {
    const occupied = new Set<number>()
    for (const plan of plans) {
      if (plan.day_of_week !== day) continue
      if (plan.id === excludePlanId) continue
      for (let h = plan.hour; h < plan.hour_end; h++) occupied.add(h)
    }
    return occupied
  }, [plans])

  const openModal = (day: number, hour: number, dayLabel: string, existingPlan?: CalendarPlan) => {
    if (!isOwnCalendar) return
    if (existingPlan) {
      const hours = new Set<number>()
      for (let h = existingPlan.hour; h < existingPlan.hour_end; h++) hours.add(h)
      setModal({ day, dayLabel, selectedHours: hours, title: existingPlan.title, description: existingPlan.description ?? '', existingPlan })
    } else {
      setModal({ day, dayLabel, selectedHours: new Set([hour]), title: '', description: '' })
    }
  }

  const handleSave = async (selectedHours: Set<number>, title: string, description: string) => {
    if (!modal || selectedHours.size === 0) return
    const hourStart = Math.min(...selectedHours)
    const hourEnd = Math.max(...selectedHours) + 1
    await savePlan(weekKey, modal.day, hourStart, hourEnd, title, description)
    setModal(null)
  }

  const handleDelete = async () => {
    if (!modal?.existingPlan) return
    await deletePlan(modal.existingPlan.id)
    setModal(null)
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
              onClick={() => { setSelectedUserId(u.id); setModal(null) }}
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
      <div className="overflow-auto border rounded-lg bg-card">
        <div className="grid min-w-[700px]" style={{ gridTemplateColumns: '64px repeat(7, 1fr)' }}>
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
                  const dayDate = new Date(weekStart)
                  dayDate.setDate(dayDate.getDate() + dayIdx)
                  const dayLabel = dayDate.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })

                  const { planStart, planCover } = getCellInfo(day, hour)

                  return (
                    <div
                      key={`${day}-${hour}`}
                      className={cn(
                        'border-b border-r min-h-[40px] relative group',
                        isOwnCalendar ? 'cursor-pointer' : 'cursor-default',
                        planStart && (isOwnCalendar
                          ? 'bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                          : 'bg-muted/60'),
                        planCover && (isOwnCalendar
                          ? 'bg-blue-50/60 dark:bg-blue-950/20 hover:bg-blue-100/60'
                          : 'bg-muted/40'),
                        !planStart && !planCover && isOwnCalendar && 'hover:bg-muted/40',
                      )}
                      onClick={() => {
                        const plan = planStart ?? planCover
                        if (plan) openModal(day, hour, dayLabel, plan)
                        else openModal(day, hour, dayLabel)
                      }}
                    >
                      {planStart ? (
                        <div className="p-1 text-xs">
                          <div className={cn(
                            'font-medium truncate',
                            isOwnCalendar ? 'text-blue-700 dark:text-blue-300' : 'text-foreground/80'
                          )}>
                            {planStart.title}
                          </div>
                          {planStart.hour_end - planStart.hour > 1 ? (
                            <div className="text-muted-foreground text-[10px]">
                              {formatHour(planStart.hour)}–{formatHour(planStart.hour_end)}
                            </div>
                          ) : planStart.description ? (
                            <div className="text-muted-foreground truncate">{planStart.description}</div>
                          ) : null}
                        </div>
                      ) : planCover ? (
                        <div className="p-1 text-xs">
                          <div className={cn(
                            'truncate opacity-60',
                            isOwnCalendar ? 'text-blue-700 dark:text-blue-300' : 'text-foreground/60'
                          )}>
                            {planCover.title}
                          </div>
                        </div>
                      ) : isOwnCalendar ? (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="w-3.5 h-3.5 text-muted-foreground/50" />
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
          ? 'Hücreye tıklayarak plan ekleyin veya düzenleyin.'
          : 'Kendi takviminizi düzenlemek için üstten adınızı seçin.'}
      </p>

      {/* Modal */}
      {modal && (
        <PlanModal
          state={modal}
          occupiedHours={getOccupiedHours(modal.day, modal.existingPlan?.id)}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
