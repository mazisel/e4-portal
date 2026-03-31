'use client'

import { useState, useEffect, useCallback } from 'react'
import { useActivity, ActivityLog } from '@/hooks/useActivity'
import { useAuth } from '@/contexts/AuthContext'
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Clock, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} dk`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}s ${m}dk` : `${h} saat`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function displayName(log: ActivityLog): string {
  if (log.profile?.full_name) return log.profile.full_name
  if (log.profile?.email) return log.profile.email.split('@')[0]
  if (log.user_email) return log.user_email.split('@')[0]
  return 'Bilinmeyen'
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

interface LogFormProps {
  initial?: ActivityLog
  onSave: (durationMinutes: number, title: string, description: string) => void
  onClose: () => void
}

function LogForm({ initial, onSave, onClose }: LogFormProps) {
  const [duration, setDuration] = useState(initial?.duration_minutes ?? 60)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [desc, setDesc] = useState(initial?.description ?? '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-card border rounded-xl shadow-xl w-full max-w-md mx-4 p-5 flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{initial ? 'Aktiviteyi Düzenle' : 'Aktivite Ekle'}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Ne yaptınız?</label>
            <input
              autoFocus
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Örn: X projesinin API entegrasyonuna baktım"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && title.trim()) onSave(duration, title.trim(), desc)
                if (e.key === 'Escape') onClose()
              }}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Süre</label>
            <div className="flex flex-wrap gap-1.5">
              {DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDuration(opt.value)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
                    duration === opt.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-muted-foreground border-border hover:bg-muted/70'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Açıklama (opsiyonel)</label>
            <textarea
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Detaylar, notlar..."
              rows={3}
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>İptal</Button>
          <Button
            size="sm"
            disabled={!title.trim()}
            onClick={() => onSave(duration, title.trim(), desc)}
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            Kaydet
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ActivityPage() {
  const [date, setDate] = useState(todayStr)
  const [showForm, setShowForm] = useState(false)
  const [editingLog, setEditingLog] = useState<ActivityLog | null>(null)
  const { logs, loading, fetchDay, addLog, updateLog, deleteLog } = useActivity()
  const { user } = useAuth()

  useEffect(() => { fetchDay(date) }, [date, fetchDay])

  const prevDay = () => setDate(d => {
    const dt = new Date(d + 'T00:00:00'); dt.setDate(dt.getDate() - 1); return dt.toISOString().split('T')[0]
  })
  const nextDay = () => setDate(d => {
    const dt = new Date(d + 'T00:00:00'); dt.setDate(dt.getDate() + 1); return dt.toISOString().split('T')[0]
  })

  const isToday = date === todayStr()

  // Günlük toplam dakika per kullanıcı
  const totalByUser = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.user_id] = (acc[l.user_id] ?? 0) + l.duration_minutes
    return acc
  }, {})

  // Kullanıcıya göre grupla
  const grouped = logs.reduce<Record<string, ActivityLog[]>>((acc, l) => {
    if (!acc[l.user_id]) acc[l.user_id] = []
    acc[l.user_id].push(l)
    return acc
  }, {})

  const handleSave = useCallback(async (durationMinutes: number, title: string, description: string) => {
    if (editingLog) {
      await updateLog(editingLog.id, durationMinutes, title, description)
      setEditingLog(null)
    } else {
      await addLog(date, durationMinutes, title, description)
      setShowForm(false)
    }
  }, [editingLog, date, addLog, updateLog])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Bu aktiviteyi silmek istiyor musunuz?')) return
    await deleteLog(id)
  }, [deleteLog])

  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500']
  const userColors: Record<string, string> = {}
  Object.keys(grouped).forEach((uid, i) => { userColors[uid] = colors[i % colors.length] })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Aktivite</h1>
          <p className="text-sm text-muted-foreground">{formatDate(date)}</p>
        </div>
        <div className="flex items-center gap-2">
          {!isToday && (
            <Button variant="outline" size="sm" onClick={() => setDate(todayStr())}>Bugün</Button>
          )}
          <Button variant="outline" size="icon" onClick={prevDay}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextDay}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Aktivite ekle butonu */}
      <Button onClick={() => setShowForm(true)} className="w-full" variant="outline">
        <Plus className="w-4 h-4 mr-2" />
        Aktivite Ekle
      </Button>

      {/* İçerik */}
      {loading ? (
        <div className="text-center text-sm text-muted-foreground py-12">Yükleniyor...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Bu gün için henüz aktivite girilmemiş.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([uid, userLogs]) => {
            const first = userLogs[0]
            const name = displayName(first)
            const isMe = uid === user?.id
            const total = totalByUser[uid] ?? 0

            return (
              <div key={uid} className="space-y-2">
                {/* Kullanıcı başlık */}
                <div className="flex items-center gap-2">
                  <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0', userColors[uid])}>
                    {initials(name)}
                  </div>
                  <span className="font-medium text-sm">{name}{isMe && <span className="text-muted-foreground font-normal"> (Ben)</span>}</span>
                  <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    Toplam: {formatDuration(total)}
                  </span>
                </div>

                {/* Aktiviteler */}
                <div className="space-y-2 pl-9">
                  {userLogs.map(log => (
                    <div key={log.id} className="bg-card border rounded-xl px-4 py-3 flex gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                            {formatDuration(log.duration_minutes)}
                          </span>
                          <span className="font-medium text-sm">{log.title}</span>
                        </div>
                        {log.description && (
                          <p className="text-xs text-muted-foreground mt-1">{log.description}</p>
                        )}
                      </div>
                      {isMe && (
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => setEditingLog(log)}
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
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modaller */}
      {showForm && (
        <LogForm
          onSave={handleSave}
          onClose={() => setShowForm(false)}
        />
      )}
      {editingLog && (
        <LogForm
          initial={editingLog}
          onSave={handleSave}
          onClose={() => setEditingLog(null)}
        />
      )}
    </div>
  )
}
