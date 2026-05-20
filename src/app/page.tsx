import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { normalizeProfileRecord } from '@/lib/profile-utils'

export default async function Home() {
  const supabase = await createClient()

  try {
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
  } catch {
    // Bozuk/expired cookie varsa login'e yönlendir
  }

  redirect('/login')
}
