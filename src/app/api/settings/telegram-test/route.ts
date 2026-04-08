import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { isAdminProfile } from '@/lib/profile-utils'

// Returns bot token + chat ID to authenticated admin users
// The actual Telegram API call is made client-side because
// the server environment cannot reach api.telegram.org (ETIMEDOUT)
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

    return NextResponse.json({ botToken, chatId })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bilinmeyen hata'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
