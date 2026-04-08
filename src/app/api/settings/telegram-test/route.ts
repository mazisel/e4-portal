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
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return json({ error: 'Yetkisiz erisim' }, 401)
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !isAdminProfile(profile)) {
      return json({ error: 'Bu islem icin yetkiniz yok' }, 403)
    }

    const { data: settings, error: settingsError } = await supabase
      .from('app_settings')
      .select('telegram_group_chat_id')
      .eq('id', 1)
      .maybeSingle()

    if (settingsError) {
      return json({ error: `Ayarlar okunamadi: ${settingsError.message}` }, 500)
    }

    const chatId = settings?.telegram_group_chat_id
    if (!chatId) {
      return json({ error: 'Telegram grup Chat ID ayarlanmamis' }, 400)
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      return json({ error: 'TELEGRAM_BOT_TOKEN ortam degiskeni tanimli degil' }, 500)
    }

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
      return json({ error: `Telegram hatasi: ${desc}` }, 502)
    }

    return json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bilinmeyen hata'
    return json({ error: message }, 500)
  }
}
