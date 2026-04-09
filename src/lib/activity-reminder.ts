import { createAdminClient } from '@/lib/supabase-admin'
import { request as httpsRequest } from 'node:https'

const REMINDER_TIME_ZONE = 'Europe/Istanbul'
const REMINDER_SLOTS = new Set(['22:00', '23:00', '23:15', '23:30', '23:45'])
const TICK_INTERVAL_MS = 10_000
const DEFAULT_TELEGRAM_CHAT_ID = '-1003743909516'

interface ProfileRow {
  id: string
  full_name: string | null
  email: string | null
  is_active?: boolean | null
}

interface ActivityLogRow {
  user_id: string
}

interface SchedulerState {
  started: boolean
  lastSlotKey: string | null
  timer: NodeJS.Timeout | null
}

declare global {
  var __activityReminderSchedulerState: SchedulerState | undefined
}

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: REMINDER_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  hourCycle: 'h23',
})

function getLocalDateTimeParts(date: Date) {
  const values = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter(part => part.type !== 'literal')
      .map(part => [part.type, part.value])
  )

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
  }
}

function getCurrentSlotKey(now: Date) {
  const parts = getLocalDateTimeParts(now)
  const time = `${parts.hour}:${parts.minute}`

  if (!REMINDER_SLOTS.has(time)) return null

  return `${parts.year}-${parts.month}-${parts.day}|${time}`
}

function getDisplayName(profile: ProfileRow) {
  const fullName = profile.full_name?.trim()
  if (fullName) return fullName

  const email = profile.email?.trim()
  if (email) return email.split('@')[0]

  return profile.id.slice(0, 8)
}

async function getTelegramChatId(): Promise<string> {
  // First try from app_settings (UI-configured)
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('app_settings')
      .select('telegram_group_chat_id')
      .eq('id', 1)
      .maybeSingle()

    if (data?.telegram_group_chat_id?.trim()) {
      return data.telegram_group_chat_id.trim()
    }
  } catch {
    // Fall through to env/default
  }

  // Fallback to env variable or hardcoded default
  return process.env.TELEGRAM_CHAT_ID ?? DEFAULT_TELEGRAM_CHAT_ID
}

function telegramPost(botToken: string, chatId: string, text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ chat_id: chatId, text })
    const req = httpsRequest(
      {
        hostname: 'api.telegram.org',
        path: `/bot${botToken}/sendMessage`,
        method: 'POST',
        family: 4, // Force IPv4
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = ''
        res.on('data', (chunk: Buffer) => { body += chunk.toString() })
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve()
          } else {
            reject(new Error(`Telegram mesaji gonderilemedi (${res.statusCode}): ${body}`))
          }
        })
      },
    )
    req.on('error', reject)
    req.write(postData)
    req.end()
  })
}

async function sendTelegramMessage(text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    throw new Error('Telegram ayarlari eksik')
  }

  const chatId = await getTelegramChatId()
  await telegramPost(botToken.trim(), chatId, text)
}

async function getMissingUsers(todayKey: string) {
  const supabase = createAdminClient()

  const [{ data: profiles, error: profilesError }, { data: logs, error: logsError }] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true }),
    supabase
      .from('activity_logs')
      .select('user_id')
      .eq('date', todayKey),
  ])

  if (profilesError) {
    throw new Error(`Profiller okunamadi: ${profilesError.message}`)
  }

  if (logsError) {
    throw new Error(`Aktiviteler okunamadi: ${logsError.message}`)
  }

  const activeUserIds = new Set((logs ?? []).map(log => (log as ActivityLogRow).user_id))

  return (profiles ?? [])
    .map(profile => profile as ProfileRow)
    .filter(profile => profile.is_active !== false)
    .filter(profile => !activeUserIds.has(profile.id))
}

async function runReminderCheck(slotKey: string) {
  const [todayKey, slotTime] = slotKey.split('|')
  const missingUsers = await getMissingUsers(todayKey)

  if (missingUsers.length === 0) {
    console.info(`[activity-reminder] ${slotTime} kontrolunde eksik aktivite yok`)
    return
  }

  const lines = missingUsers.map(profile => `- ${getDisplayName(profile)}`)
  const message = [
    `Aktivite uyarisi (${slotTime})`,
    `${todayKey} tarihinde hala aktivite girmeyen kullanicilar var:`,
    ...lines,
  ].join('\n')

  await sendTelegramMessage(message)
  console.info(`[activity-reminder] ${slotTime} mesaj gonderildi (${missingUsers.length} kisi)`)
}

function ensureConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.TELEGRAM_BOT_TOKEN
  )
}

export async function runManualReminderCheck(): Promise<{ ok: boolean; message: string }> {
  const parts = getLocalDateTimeParts(new Date())
  const todayKey = `${parts.year}-${parts.month}-${parts.day}`
  const time = `${parts.hour}:${parts.minute}`

  const missingUsers = await getMissingUsers(todayKey)

  if (missingUsers.length === 0) {
    return { ok: true, message: 'Tüm kullanıcılar bugün aktivite girmiş.' }
  }

  const lines = missingUsers.map(profile => `- ${getDisplayName(profile)}`)
  const text = [
    `Manuel kontrol (${time})`,
    `${todayKey} tarihinde hala aktivite girmeyen kullanicilar:`,
    ...lines,
  ].join('\n')

  await sendTelegramMessage(text)
  return { ok: true, message: `${missingUsers.length} eksik kullanıcı bildirildi.` }
}

export function startActivityReminderScheduler() {
  if (process.env.NODE_ENV !== 'production') {
    return
  }

  if (!ensureConfig()) {
    console.warn('[activity-reminder] Scheduler baslatilmadi: eksik env var')
    return
  }

  if (globalThis.__activityReminderSchedulerState?.started) {
    return
  }

  const state: SchedulerState = {
    started: true,
    lastSlotKey: getCurrentSlotKey(new Date()),
    timer: null,
  }

  const tick = () => {
    const slotKey = getCurrentSlotKey(new Date())

    if (!slotKey || slotKey === state.lastSlotKey) {
      return
    }

    state.lastSlotKey = slotKey

    void runReminderCheck(slotKey).catch(error => {
      const message = error instanceof Error ? error.message : String(error)
      console.error('[activity-reminder] Kontrol hatasi:', message)
    })
  }

  state.timer = setInterval(tick, TICK_INTERVAL_MS)
  state.timer.unref?.()

  globalThis.__activityReminderSchedulerState = state
  console.info('[activity-reminder] Scheduler aktif')
}
