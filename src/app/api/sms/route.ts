import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { sendSms } from '@/lib/sms'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
  }

  const { phone, message } = await request.json()

  if (!phone || !message) {
    return NextResponse.json({ error: 'Telefon ve mesaj zorunludur' }, { status: 400 })
  }

  try {
    const result = await sendSms({ phone, message })
    return NextResponse.json(result)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'SMS gönderilemedi'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
