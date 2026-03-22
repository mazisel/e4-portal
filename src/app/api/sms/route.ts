import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  // Oturum kontrolü
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
  }

  const { phone, message } = await request.json()

  if (!phone || !message) {
    return NextResponse.json({ error: 'Telefon ve mesaj zorunludur' }, { status: 400 })
  }

  const usercode = process.env.NETGSM_USERCODE
  const password = process.env.NETGSM_PASSWORD
  const msgheader = process.env.NETGSM_MSGHEADER

  if (!usercode || !password || !msgheader) {
    return NextResponse.json({ error: 'NetGSM ayarları yapılandırılmamış' }, { status: 500 })
  }

  // Türkiye formatına normalize et: 05XX → 905XX, +90 → 90
  const normalized = phone
    .replace(/\s+/g, '')
    .replace(/^\+/, '')
    .replace(/^0/, '90')

  const params = new URLSearchParams({
    usercode,
    password,
    gsmno: normalized,
    message,
    msgheader,
  })

  try {
    const res = await fetch(
      `https://api.netgsm.com.tr/sms/send/get/?${params.toString()}`,
      { method: 'GET' }
    )
    const text = await res.text()

    // NetGSM başarı kodları: 00, 01, 02
    const code = text.trim().split(' ')[0]
    if (['00', '01', '02'].includes(code)) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: `NetGSM hata kodu: ${text.trim()}` },
      { status: 502 }
    )
  } catch (err) {
    return NextResponse.json({ error: 'SMS gönderilemedi' }, { status: 500 })
  }
}
