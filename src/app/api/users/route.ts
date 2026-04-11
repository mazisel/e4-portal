import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { isAdminProfile, normalizeProfileRecord } from '@/lib/profile-utils'
import { UserRole } from '@/types'

function isValidRole(value: unknown): value is UserRole {
  return value === 'admin' || value === 'user'
}

async function getCurrentAdminProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Yetkisiz erisim' }, { status: 401 }) }
  }

  const { data: currentProfile, error: currentProfileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (currentProfileError || !isAdminProfile(currentProfile)) {
    return { error: NextResponse.json({ error: 'Bu islem icin yetkiniz yok' }, { status: 403 }) }
  }

  return {
    currentUser: user,
    currentProfile: normalizeProfileRecord(currentProfile),
  }
}

export async function POST(request: NextRequest) {
  const adminCheck = await getCurrentAdminProfile()
  if ('error' in adminCheck) return adminCheck.error

  const payload = await request.json()
  const fullName = typeof payload.fullName === 'string' ? payload.fullName.trim() : ''
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : ''
  const password = typeof payload.password === 'string' ? payload.password : ''
  const canAccessFinance = payload.canAccessFinance
  const isActive = payload.isActive
  const role = payload.role
  const phone = typeof payload.phone === 'string' ? payload.phone.trim() : null

  if (!email || password.length < 6 || typeof canAccessFinance !== 'boolean' || typeof isActive !== 'boolean' || !isValidRole(role)) {
    return NextResponse.json({ error: 'Gecersiz istek' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: createdUserData, error: createUserError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName, name: fullName } : {},
  })

  if (createUserError || !createdUserData.user) {
    return NextResponse.json({ error: createUserError?.message ?? 'Kullanici olusturulamadi' }, { status: 500 })
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .upsert(
      {
        id: createdUserData.user.id,
        email,
        full_name: fullName || null,
        role,
        is_active: isActive,
        can_access_finance: canAccessFinance,
        phone,
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single()

  if (profileError) {
    console.error('Profile Upsert Error:', profileError)
    return NextResponse.json({ 
      error: profileError.message,
      details: 'Lütfen Supabase üzerinden "phone" sütununu eklediğinizden emin olun.' 
    }, { status: 500 })
  }

  return NextResponse.json({
    user: {
      ...normalizeProfileRecord(profile),
      created_at: profile.created_at,
    },
  })
}

export async function PATCH(request: NextRequest) {
  const adminCheck = await getCurrentAdminProfile()
  if ('error' in adminCheck) return adminCheck.error

  const payload = await request.json()
  const userId = typeof payload.userId === 'string' ? payload.userId : null
  const fullName = typeof payload.fullName === 'string' ? payload.fullName.trim() : ''
  const canAccessFinance = payload.canAccessFinance
  const isActive = payload.isActive
  const role = payload.role
  const phone = typeof payload.phone === 'string' ? payload.phone.trim() : null

  if (!userId || typeof canAccessFinance !== 'boolean' || typeof isActive !== 'boolean' || !isValidRole(role)) {
    return NextResponse.json({ error: 'Gecersiz istek' }, { status: 400 })
  }

  if (userId === adminCheck.currentUser.id && role !== 'admin') {
    return NextResponse.json({ error: 'Kendi admin rolunu kaldiramazsin' }, { status: 400 })
  }

  if (userId === adminCheck.currentUser.id && isActive === false) {
    return NextResponse.json({ error: 'Kendi hesabini pasiflestiremezsin' }, { status: 400 })
  }

  const admin = createAdminClient()
  const metadata = fullName ? { full_name: fullName, name: fullName } : {}

  const { error: authUpdateError } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: metadata,
  })

  if (authUpdateError) {
    return NextResponse.json({ error: authUpdateError.message }, { status: 500 })
  }

  const { data: updatedUser, error: updateError } = await admin
    .from('profiles')
    .update({
      full_name: fullName || null,
      role,
      is_active: isActive,
      can_access_finance: canAccessFinance,
      phone,
    })
    .eq('id', userId)
    .select('*')
    .single()

  if (updateError) {
    console.error('Profile Update Error:', updateError)
    return NextResponse.json({ 
      error: updateError.message,
      details: 'Lütfen Supabase üzerinden "phone" sütununu eklediğinizden emin olun.' 
    }, { status: 500 })
  }

  return NextResponse.json({
    user: {
      ...normalizeProfileRecord(updatedUser),
      created_at: updatedUser.created_at,
    },
  })
}
