import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { isAdminProfile } from '@/lib/profile-utils'

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz erisim' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !isAdminProfile(profile)) {
      return NextResponse.json({ error: 'Bu islem icin yetkiniz yok' }, { status: 403 })
    }

    const { data: settings, error: settingsError } = await supabase
      .from('app_settings')
      .select('telegram_group_chat_id')
      .eq('id', 1)
      .maybeSingle()

    if (settingsError) {
      return NextResponse.json({ error: `Ayarlar hatasi: ${settingsError.message}` }, { status: 500 })
    }

    const chatId = settings?.telegram_group_chat_id?.trim()
    if (!chatId) {
      return NextResponse.json({ error: 'Telegram grup Chat ID ayarlanmamis' }, { status: 400 })
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim()
    if (!botToken) {
      return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN ortam degiskeni tanimli degil' }, { status: 500 })
    }

    // Build URL carefully and verify it's valid
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`
    try {
      new URL(telegramUrl)
    } catch {
      return NextResponse.json({
        error: `Gecersiz Telegram URL olusturuldu. Token uzunlugu: ${botToken.length}, ilk 4 karakter: ${botToken.slice(0, 4)}`
      }, { status: 500 })
    }

    const body = JSON.stringify({
      chat_id: chatId,
      text: '✅ E4 Portal - Telegram bağlantısı başarıyla çalışıyor!',
    })

    // Use same fetch pattern as working SMS route
    const res = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })

    const text = await res.text()

    if (!res.ok) {
      let desc = text
      try {
        desc = JSON.parse(text).description ?? text
      } catch { /* use raw text */ }
      return NextResponse.json({ error: `Telegram hatasi (${res.status}): ${desc}` }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    // Serialize full error details
    const message = err instanceof Error
      ? `${err.name}: ${err.message}${err.cause ? ` | cause: ${JSON.stringify(err.cause)}` : ''}`
      : JSON.stringify(err)
    return NextResponse.json({ error: `Hata: ${message}` }, { status: 500 })
  }
}
