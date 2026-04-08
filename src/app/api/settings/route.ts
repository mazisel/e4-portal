import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { isAdminProfile, normalizeProfileRecord } from '@/lib/profile-utils'

async function getCurrentAdminProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Yetkisiz erisim' }, { status: 401 }) }
  }

  const { data: currentProfile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !isAdminProfile(currentProfile)) {
    return { error: NextResponse.json({ error: 'Bu islem icin yetkiniz yok' }, { status: 403 }) }
  }

  return { supabase, profile: normalizeProfileRecord(currentProfile) }
}

export async function GET() {
  const adminCheck = await getCurrentAdminProfile()
  if ('error' in adminCheck) return adminCheck.error

  const { data, error } = await adminCheck.supabase
    .from('app_settings')
    .select('telegram_group_chat_id, updated_at')
    .eq('id', 1)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ settings: data })
}

export async function PATCH(request: NextRequest) {
  const adminCheck = await getCurrentAdminProfile()
  if ('error' in adminCheck) return adminCheck.error

  const payload = await request.json()
  const telegramGroupChatId = payload.telegramGroupChatId === null || typeof payload.telegramGroupChatId === 'string'
    ? (payload.telegramGroupChatId?.trim() || null)
    : undefined

  if (telegramGroupChatId === undefined) {
    return NextResponse.json({ error: 'Gecersiz istek' }, { status: 400 })
  }

  const { data, error } = await adminCheck.supabase
    .from('app_settings')
    .update({ telegram_group_chat_id: telegramGroupChatId })
    .eq('id', 1)
    .select('telegram_group_chat_id, updated_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ settings: data })
}
