import { isSupabaseConfigured, supabase } from './supabase.js'

export function subscribeToTable(table, callback) {
  if (!isSupabaseConfigured) return () => {}
  const channel = supabase
    .channel(`realtime:${table}:${crypto.randomUUID()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe()
  return () => supabase.removeChannel(channel)
}
