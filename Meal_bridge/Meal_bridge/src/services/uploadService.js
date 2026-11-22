import { isSupabaseConfigured, supabase } from '../lib/supabase.js'

export async function uploadListingImage(file) {
  if (!isSupabaseConfigured) {
    return { ok: true, url: URL.createObjectURL(file) }
  }
  if (!file.type.startsWith('image/')) {
    return { ok: false, error: 'Please select an image file.' }
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: 'Image must be smaller than 5 MB.' }
  }

  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: 'You must be signed in.' }

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${auth.user.id}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from('listing-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) return { ok: false, error: error.message }

  const { data } = supabase.storage.from('listing-images').getPublicUrl(path)
  return { ok: true, url: data.publicUrl }
}
