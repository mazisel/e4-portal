'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCalendar, CalendarPlan } from '@/hooks/useCalendar'
import { ChevronLeft, ChevronRight, X, Check, Plus, Pencil } from 'lucide-react'
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

function shortEmail(email: string | null): string {
  if (!email) return '?'
  return email.split('@')[0]
}

interface CellEditorProps {
  plan: CalendarPlan | undefined
  onSave: (title: string, description: string) => void
  onDelete: () => void
  onClose: () => void
}

function CellEditor({ plan, onSave, onDelete, onClose }: CellEditorProps) {
  const [title, setTitle] = useState(plan?.title ?? '')
  const [desc, setDesc] = useState(plan?.description ?? '')

  return (
    <div className="flex flex-col gap-1.5 p-1">
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
        {plan && (
          <button onClick={onDelete} className="text-destructive hover:underline text-xs mr-auto">
            Sil
          </button>
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
  const [editing, setEditing] = useState<{ day: number; hour: number } | null>(null)
  const { plans, currentUserId, loading, fetchWeek, upsertPlan, deletePlan } = useCalendar()

  const weekKey = formatWeekStart(weekStart)

  useEffect(() => {
    fetchWeek(weekKey)
  }, [weekKey, fetchWeek])

  const getPlans = useCallback(
    (day: number, hour: number) =>
      plans.filter(p => p.day_of_week === day && p.hour === hour),
    [plans]
  )

  const getMyPlan = useCallback(
    (day: number, hour: number) =>
      plans.find(p => p.day_of_week === day && p.hour === hour && p.user_id === currentUserId),
    [plans, currentUserId]
  )

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

  const handleSave = async (day: number, hour: number, title: string, desc: string) => {
    await upsertPlan(weekKey, day, hour, title, desc)
    setEditing(null)
  }

  const handleDelete = async (day: number, hour: number) => {
    const plan = getMyPlan(day, hour)
    if (plan) await deletePlan(plan.id)
    setEditing(null)
  }

  return (
    <div className="space-y-4">
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
            <div className="col-span-8 py-12 text-center text-sm text-muted-foreground">
              Yükleniyor...
            </div>
          ) : (
            HOURS.map(hour => (
              <>
                <div
                  key={`h-${hour}`}
                  className="border-b border-r px-2 py-1 text-xs text-muted-foreground text-right pr-3 leading-8"
                >
                  {formatHour(hour)}
                </div>

                {DAYS.map((_, dayIdx) => {
                  const day = dayIdx + 1
                  const cellPlans = getPlans(day, hour)
                  const myPlan = getMyPlan(day, hour)
                  const isEditing = editing?.day === day && editing?.hour === hour

                  return (
                    <div
                      key={`${day}-${hour}`}
                      className="border-b border-r min-h-[44px] p-1 group relative"
                    >
                      {isEditing ? (
                        <CellEditor
                          plan={myPlan}
                          onSave={(title, desc) => handleSave(day, hour, title, desc)}
                          onDelete={() => handleDelete(day, hour)}
                          onClose={() => setEditing(null)}
                        />
                      ) : (
                        <>
                          {/* Diğer kullanıcıların planları */}
                          {cellPlans
                            .filter(p => p.user_id !== currentUserId)
                            .map(p => (
                              <div
                                key={p.id}
                                className="text-xs rounded px-1.5 py-0.5 mb-0.5 bg-muted text-muted-foreground"
                              >
                                <span className="font-medium text-foreground/70">{shortEmail(p.user_email)}</span>
                                {' · '}
                                <span className="truncate">{p.title}</span>
                              </div>
                            ))}

                          {/* Kendi planım */}
                          {myPlan ? (
                            <div
                              className="text-xs rounded px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 cursor-pointer flex items-start justify-between gap-1"
                              onClick={() => setEditing({ day, hour })}
                            >
                              <div className="min-w-0">
                                <div className="font-medium truncate">{myPlan.title}</div>
                                {myPlan.description && (
                                  <div className="text-blue-600/70 dark:text-blue-300/70 truncate">{myPlan.description}</div>
                                )}
                              </div>
                              <Pencil className="w-2.5 h-2.5 shrink-0 mt-0.5 opacity-60" />
                            </div>
                          ) : (
                            /* Boş hücre: + butonu */
                            <button
                              className="absolute inset-0 w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setEditing({ day, hour })}
                            >
                              <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </>
            ))
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Mavi plan sizin — düzenlemek için tıklayın. Gri planlar diğer ekip üyelerine ait.
      </p>
    </div>
  )
}
