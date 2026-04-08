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
  error: string | null
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  error: null,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
})

const AUTH_LOAD_ERROR = 'Oturum bilgileri yüklenemedi. Lütfen sayfayı yenileyin.'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const fetchProfile = useCallback(async (userId: string, email?: string, fullName?: string) => {
    if (email) {
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(
          { id: userId, email, ...(fullName ? { full_name: fullName } : {}) },
          { onConflict: 'id' }
        )

      if (upsertError) {
        throw upsertError
      }
    }

    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) {
      throw profileError
    }

    const normalizedProfile = normalizeProfileRecord(data)
    setProfile(normalizedProfile)
    return normalizedProfile
  }, [supabase])

  const syncAuthState = useCallback(async (nextSession: Session | null) => {
    setError(null)
    setSession(nextSession)
    setUser(nextSession?.user ?? null)

    if (!nextSession?.user) {
      setProfile(null)
      return
    }

    const nextProfile = await fetchProfile(
      nextSession.user.id,
      nextSession.user.email,
      nextSession.user.user_metadata?.full_name ?? nextSession.user.user_metadata?.name
    )

    if (nextProfile && !nextProfile.is_active) {
      await supabase.auth.signOut()
      setSession(null)
      setUser(null)
      setProfile(null)
      router.push('/login')
    }
  }, [fetchProfile, router, supabase])

  useEffect(() => {
    let active = true

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!active) {
          return
        }

        await syncAuthState(session)
      } catch (authError) {
        console.error('Auth initialization failed', authError)

        if (!active) {
          return
        }

        setError(AUTH_LOAD_ERROR)
        setSession(null)
        setUser(null)
        setProfile(null)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, nextSession) => {
        if (event === 'INITIAL_SESSION') {
          return
        }

        try {
          await syncAuthState(nextSession)
        } catch (authError) {
          console.error('Auth state sync failed', authError)

          if (!active) {
            return
          }

          setError(AUTH_LOAD_ERROR)
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [supabase, syncAuthState])

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)

      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: error.message }

      const signedInUser = data.user ?? data.session?.user
      if (signedInUser) {
        const nextProfile = await fetchProfile(
          signedInUser.id,
          signedInUser.email,
          signedInUser.user_metadata?.full_name ?? signedInUser.user_metadata?.name
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
    } catch (authError) {
      console.error('Sign in failed', authError)
      setError(AUTH_LOAD_ERROR)
      return { error: AUTH_LOAD_ERROR }
    }
  }

  const signOut = async () => {
    setError(null)
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, error, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
