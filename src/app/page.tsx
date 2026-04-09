import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { normalizeProfileRecord } from '@/lib/profile-utils'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const normalizedProfile = normalizeProfileRecord(profile)

    if (normalizedProfile && !normalizedProfile.is_active) {
      redirect('/login')
    }

    redirect('/dashboard')
  }

  redirect('/login')
}
