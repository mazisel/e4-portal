'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { normalizeProfileRecord } from '@/lib/profile-utils'
import { UserProfile } from '@/types'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const fetchProfile = useCallback(async (userId: string, email?: string, fullName?: string) => {
    if (email) {
      await supabase
        .from('profiles')
        .upsert(
          { id: userId, email, ...(fullName ? { full_name: fullName } : {}) },
          { onConflict: 'id' }
        )
    }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    const normalizedProfile = normalizeProfileRecord(data)
    setProfile(normalizedProfile)
    return normalizedProfile
  }, [supabase])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        const nextProfile = await fetchProfile(
          session.user.id,
          session.user.email,
          session.user.user_metadata?.full_name ?? session.user.user_metadata?.name
        )

        if (nextProfile && !nextProfile.is_active) {
          await supabase.auth.signOut()
          setSession(null)
          setUser(null)
          setProfile(null)
          router.push('/login')
        }
      }

      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          const nextProfile = await fetchProfile(
            session.user.id,
            session.user.email,
            session.user.user_metadata?.full_name ?? session.user.user_metadata?.name
          )

          if (nextProfile && !nextProfile.is_active) {
            await supabase.auth.signOut()
            setSession(null)
            setUser(null)
            setProfile(null)
            router.push('/login')
          }
        } else {
          setProfile(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile, router, supabase])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const nextProfile = await fetchProfile(
        user.id,
        user.email,
        user.user_metadata?.full_name ?? user.user_metadata?.name
      )

      if (nextProfile && !nextProfile.is_active) {
        await supabase.auth.signOut()
        setSession(null)
        setUser(null)
        setProfile(null)
        toast.error('Hesabiniz pasif durumda. Yonetici ile iletisime gecin.')
        return { error: 'Hesabiniz pasif durumda.' }
      }
    }

    router.push('/home')
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
