import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { sendWhatsappMessage } from '@/lib/whatsapp'

export async function POST(request: NextRequest) {
  // Oturum kontrolü
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
  }

  const { phone, message, variables } = await request.json()

  if (!phone || !message) {
    return NextResponse.json({ error: 'Telefon ve mesaj zorunludur' }, { status: 400 })
  }

  try {
    const result = await sendWhatsappMessage({
      phone,
      message,
      variables,
    })

    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'WhatsApp mesajı gönderilemedi'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
