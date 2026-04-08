import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { isAdminProfile } from '@/lib/profile-utils'

export async function POST() {
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

  const { data: settings } = await supabase
    .from('app_settings')
    .select('telegram_group_chat_id')
    .eq('id', 1)
    .maybeSingle()

  const chatId = settings?.telegram_group_chat_id
  if (!chatId) {
    return NextResponse.json({ error: 'Telegram grup Chat ID ayarlanmamis' }, { status: 400 })
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN ortam degiskeni tanimli degil' }, { status: 500 })
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: 'E4 Portal - Telegram baglantisi basariyla calisiyor!',
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    return NextResponse.json({ error: `Telegram mesaji gonderilemedi: ${body}` }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
