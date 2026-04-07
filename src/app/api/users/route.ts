import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Yetkisiz erisim' }, { status: 401 })
  }

  const { userId, canAccessFinance } = await request.json()

  if (typeof userId !== 'string' || typeof canAccessFinance !== 'boolean') {
    return NextResponse.json({ error: 'Gecersiz istek' }, { status: 400 })
  }

  const { data: currentProfile, error: currentProfileError } = await supabase
    .from('profiles')
    .select('id, can_access_finance')
    .eq('id', user.id)
    .single()

  if (currentProfileError || !currentProfile?.can_access_finance) {
    return NextResponse.json({ error: 'Bu islem icin yetkiniz yok' }, { status: 403 })
  }

  if (userId === user.id && canAccessFinance === false) {
    return NextResponse.json({ error: 'Kendi finans yetkini kapatamazsin' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: updatedUser, error: updateError } = await admin
    .from('profiles')
    .update({ can_access_finance: canAccessFinance })
    .eq('id', userId)
    .select('id, full_name, email, can_access_finance, created_at')
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ user: updatedUser })
}
