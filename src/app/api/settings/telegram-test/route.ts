import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { isAdminProfile } from '@/lib/profile-utils'

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function POST(_request: NextRequest) {
  // Step 1: Auth
  let supabase
  try {
    supabase = await createClient()
  } catch (err) {
    return json({ error: `[1] createClient hatasi: ${err instanceof Error ? err.message : err}` }, 500)
  }

  let user
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (err) {
    return json({ error: `[2] getUser hatasi: ${err instanceof Error ? err.message : err}` }, 500)
  }

  if (!user) {
    return json({ error: 'Yetkisiz erisim' }, 401)
  }

  // Step 2: Admin check
  let profile
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (error) return json({ error: `[3] Profil hatasi: ${error.message}` }, 500)
    profile = data
  } catch (err) {
    return json({ error: `[3] Profil fetch hatasi: ${err instanceof Error ? err.message : err}` }, 500)
  }

  if (!isAdminProfile(profile)) {
    return json({ error: 'Bu islem icin yetkiniz yok' }, 403)
  }

  // Step 3: Read settings
  let chatId: string | null = null
  try {
    const { data: settings, error } = await supabase
      .from('app_settings')
      .select('telegram_group_chat_id')
      .eq('id', 1)
      .maybeSingle()
    if (error) return json({ error: `[4] Ayarlar hatasi: ${error.message}` }, 500)
    chatId = settings?.telegram_group_chat_id ?? null
  } catch (err) {
    return json({ error: `[4] Ayarlar fetch hatasi: ${err instanceof Error ? err.message : err}` }, 500)
  }

  if (!chatId) {
    return json({ error: 'Telegram grup Chat ID ayarlanmamis' }, 400)
  }

  // Step 4: Check bot token
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    return json({ error: 'TELEGRAM_BOT_TOKEN ortam degiskeni tanimli degil' }, 500)
  }

  // Step 5: Send Telegram message
  try {
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`
    const telegramRes = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: '✅ E4 Portal - Telegram bağlantısı başarıyla çalışıyor!',
      }),
    })

    const telegramBody = await telegramRes.json().catch(() => null)

    if (!telegramRes.ok) {
      const desc = telegramBody?.description ?? 'Bilinmeyen hata'
      return json({ error: `[5] Telegram API hatasi (${telegramRes.status}): ${desc}` }, 502)
    }

    return json({ ok: true })
  } catch (err) {
    return json({ error: `[5] Telegram fetch hatasi: ${err instanceof Error ? err.message : err}` }, 500)
  }
}
