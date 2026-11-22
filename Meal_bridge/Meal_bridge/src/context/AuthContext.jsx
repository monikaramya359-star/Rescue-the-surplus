import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase.js'
import { getDemoSession } from '../services/authService.js'

const AuthContext = createContext(null)

async function loadProfile(user) {
  if (!user) return null

  const demo = getDemoSession()
  if (demo && demo.id === user.id) {
    return { id: demo.id, email: demo.email, role: demo.role, accountStatus: 'Active' }
  }

  if (!isSupabaseConfigured) {
    return { id: user.id, email: user.email, role: user.role || 'donor', accountStatus: 'Active' }
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id,role,email,phone,location,account_status')
      .eq('id', user.id)
      .maybeSingle()

    if (error) throw error
    return data ? {
      id: data.id,
      email: data.email,
      role: data.role,
      phone: data.phone,
      location: data.location,
      accountStatus: data.account_status,
    } : null
  } catch {
    // Supabase profile lookup unreachable or permission-restricted (anon role lacks
    // table privileges). Fall back to the demo session created on login/register.
    const demo = getDemoSession()
    if (demo && demo.id === user.id) {
      return { id: demo.id, email: demo.email, role: demo.role, accountStatus: 'Active' }
    }
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    let mounted = true

    async function sync(user) {
      try {
        const nextProfile = await loadProfile(user)
        if (mounted) setProfile(nextProfile)
      } catch {
        if (mounted) setProfile(null)
      }
    }

    if (!isSupabaseConfigured) {
      return undefined
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      sync(data.session?.user).finally(() => mounted && setLoading(false))
    })

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(true)
      sync(nextSession?.user).finally(() => mounted && setLoading(false))
    })

    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(() => ({
    session,
    profile,
    loading,
    isAuthenticated: Boolean(profile),
  }), [session, profile, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
