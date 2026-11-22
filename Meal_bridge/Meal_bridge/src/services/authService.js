import { isSupabaseConfigured, supabase } from '../lib/supabase.js'
import { toFriendlyAuthError } from '../lib/errorMessages.js'

const wait = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms))
const createId = () => Math.random().toString(36).slice(2, 10)

// Normalized failure shape. `error` is kept for existing callers; `message` is the canonical field.
function authFailure(error) {
  const message = toFriendlyAuthError(error)
  return { ok: false, error: message, message }
}

// Local demo session, used ONLY when Supabase is not configured (no VITE_SUPABASE_* env).
const DEMO_USER_ID = 'demo-user-0000'
let demoSession = null

export function getDemoSession() {
  return demoSession
}

export async function registerUser(roleKey, values) {
  if (!isSupabaseConfigured) {
    await wait()
    return {
      ok: true,
      user: {
        id: createId(),
        role: roleKey,
        email: values.email,
        name:
          values.fullName ||
          values.ownerName ||
          values.contactPerson ||
          values.restaurantName ||
          values.organizationName,
      },
    }
  }

  try {
    const metadata = { ...values, role: roleKey }
    const { data, error } = await supabase.auth.signUp({
      email: values.email.trim(),
      password: values.password,
      options: { data: metadata },
    })
    if (error) return authFailure(error)
    return { ok: true, user: data.user }
  } catch (error) {
    return authFailure(error)
  }
}

export async function loginUser(values) {
  if (!isSupabaseConfigured) {
    await wait()
    return { ok: true, user: { id: DEMO_USER_ID, email: values.email, role: values.role || 'donor' } }
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email.trim(),
      password: values.password,
    })
    if (error) return authFailure(error)
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle()
    demoSession = {
      ...data.user,
      role: values.role || profile?.role || data.user.user_metadata?.role || null,
      email: values.email.trim(),
    }
    return {
      ok: true,
      user: demoSession,
    }
  } catch (error) {
    return authFailure(error)
  }
}

export async function requestPasswordReset(email) {
  if (!isSupabaseConfigured) {
    await wait()
    return { ok: true, email }
  }

  const redirectTo = `${window.location.origin}/reset-password`
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
  if (error) return authFailure(error)
  return { ok: true, email }
}

export async function logoutUser() {
  if (isSupabaseConfigured) {
    const { error } = await supabase.auth.signOut()
    if (error) return authFailure(error)
  }
  return { ok: true }
}

export async function updatePassword(password) {
  if (!isSupabaseConfigured) return { ok: true }
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return authFailure(error)
  return { ok: true }
}
