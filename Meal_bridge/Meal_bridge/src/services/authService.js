// Frontend demo only. Replace these bodies with Supabase calls (supabase.auth.signUp / signInWithPassword / resetPasswordForEmail) without changing the callers.

const wait = (ms = 700) => new Promise((resolve) => setTimeout(resolve, ms))

const createId = () => Math.random().toString(36).slice(2, 10)

export async function registerUser(roleKey, values) {
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

export async function loginUser(values) {
  await wait()
  return { ok: true, user: { id: createId(), email: values.email, role: 'donor' } }
}

export async function requestPasswordReset(email) {
  await wait()
  return { ok: true, email }
}
