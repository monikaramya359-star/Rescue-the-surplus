import { isSupabaseConfigured, supabase } from '../lib/supabase.js'
import { toFriendlyDataError } from '../lib/errorMessages.js'

// Normalized failure shape. `message` is the canonical user-safe text; `error` mirrors it for existing callers.
function failure(message) {
  return { ok: false, error: message, message }
}

function normalizeError(error) {
  return failure(toFriendlyDataError(error))
}

export function maskPickupArea(value) {
  if (!value) return 'Approximate area unavailable'
  const parts = String(value).split(',').map((part) => part.trim()).filter(Boolean)
  if (parts.length > 1) return parts[parts.length - 2] || parts[parts.length - 1]
  return String(value).replace(/^\d+\s*/, '').replace(/\b\d{6}\b/g, '').trim() || 'Approximate area'
}

export function normalizeListing(row) {
  if (!row) return row
  return {
    id: row.id,
    donorId: row.donor_id,
    donorName: row.donors?.restaurant_name || 'Donor',
    donorType: row.donors?.donor_type || 'Other',
    foodName: row.food_name,
    category: row.category,
    quantity: row.quantity,
    claimedQuantity: row.claimed_quantity,
    availableQuantity: row.quantity - row.claimed_quantity,
    unit: row.unit,
    preparedAt: row.prepared_at,
    pickupDeadline: row.pickup_deadline,
    pickupLocation: maskPickupArea(row.pickup_location),
    storage: row.storage_condition,
    allergens: row.allergens,
    packaging: row.packaging,
    image: row.image_url,
    imageUrl: row.image_url,
    status: row.status,
    postedAt: row.created_at,
  }
}

export function normalizeClaim(row) {
    if (!row) return row
    const listing = row.food_listings || {}
    const donor = listing.donors || {}
    return {
      id: row.id,
      donationId: row.listing_id,
      foodName: listing.food_name,
      donorName: donor.restaurant_name || 'Donor',
      image: listing.image_url,
      quantityClaimed: row.quantity_claimed,
      unit: listing.unit,
      pickupLocation: maskPickupArea(listing.pickup_location),
      storage: listing.storage_condition,
      allergens: listing.allergens,
      pickupDeadline: listing.pickup_deadline,
      claimedAt: row.claimed_at,
      collectedAt: row.collected_at,
      deliveredAt: row.delivered_at,
      status: row.status,
    }
}

export function normalizeTask(row) {
    if (!row) return row
    const claim = row.food_claims || {}
    const listing = claim.food_listings || {}
    const donor = listing.donors || {}
    const receiver = claim.receivers || {}
    return {
      id: row.id,
      pickupId: claim.listing_id,
      foodName: listing.food_name,
      donorName: donor.restaurant_name || 'Donor',
      receiverOrganization: receiver.organization_name || 'Receiver',
      receiverLocation: receiver.location || '',
      quantity: claim.quantity_claimed,
      unit: listing.unit,
      pickupLocation: maskPickupArea(listing.pickup_location),
      pickupDeadline: listing.pickup_deadline,
      image: listing.image_url,
      status: row.status,
      volunteerId: row.volunteer_id,
  }
}

export async function getAvailableListings() {
  if (!isSupabaseConfigured) return { ok: true, data: null }
  const { data, error } = await supabase
    .from('food_listings')
    .select('*, donors(restaurant_name,owner_name,donor_type)')
    .eq('status', 'Active')
    .order('pickup_deadline', { ascending: true })
  return error ? normalizeError(error) : { ok: true, data }
}

export async function getDonorListings() {
  if (!isSupabaseConfigured) return { ok: true, data: null }
  const { data, error } = await supabase
    .from('food_listings')
    .select('*')
    .order('created_at', { ascending: false })
  return error ? normalizeError(error) : { ok: true, data }
}

export async function createListing(values) {
  if (!isSupabaseConfigured) return { ok: true, data: null }
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return failure('You must be signed in.')
  const { data, error } = await supabase
    .from('food_listings')
    .insert({
      donor_id: auth.user.id,
      food_name: values.foodName,
      category: values.category || 'Other',
      quantity: values.quantity,
      unit: values.unit || 'Meals',
      prepared_at: values.preparedAt || null,
      pickup_deadline: values.pickupDeadline,
      storage_condition: values.storage,
      allergens: values.allergens,
      packaging: values.packaging,
      pickup_location: values.pickupLocation || null,
      image_url: values.imageUrl || null,
    })
    .select()
    .single()
  return error ? normalizeError(error) : { ok: true, data }
}

export async function updateListing(id, values) {
  if (!isSupabaseConfigured) return { ok: true, data: null }
  const { data, error } = await supabase
    .from('food_listings')
    .update({
      food_name: values.foodName,
      category: values.category,
      quantity: values.quantity,
      unit: values.unit,
      prepared_at: values.preparedAt || null,
      pickup_deadline: values.pickupDeadline,
      storage_condition: values.storage,
      allergens: values.allergens,
      packaging: values.packaging,
      pickup_location: values.pickupLocation,
      image_url: values.imageUrl || null,
    })
    .eq('id', id)
    .select()
    .single()
  return error ? normalizeError(error) : { ok: true, data }
}

export async function cancelListing(id) {
  if (!isSupabaseConfigured) return { ok: true }
  const { data, error } = await supabase.rpc('cancel_listing', { p_listing_id: id })
  return error ? normalizeError(error) : { ok: true, data }
}

// Returns { ok: true, data: claimId } on success.
export async function claimListing(listingId, quantity) {
  if (!isSupabaseConfigured) return { ok: true }
  const { data, error } = await supabase.rpc('claim_food', {
    p_listing_id: listingId,
    p_quantity: quantity,
  })
  return error ? normalizeError(error) : { ok: true, data }
}

export async function cancelClaim(claimId) {
  if (!isSupabaseConfigured) return { ok: true }
  const { data, error } = await supabase.rpc('cancel_claim', { p_claim_id: claimId })
  return error ? normalizeError(error) : { ok: true, data }
}

export async function getReceiverClaims() {
  if (!isSupabaseConfigured) return { ok: true, data: null }
  const { data, error } = await supabase
    .from('food_claims')
    .select('*, food_listings(*, donors(restaurant_name,donor_type)), pickup_tasks(*)')
    .order('claimed_at', { ascending: false })
  return error ? normalizeError(error) : { ok: true, data }
}

export async function getVolunteerTasks() {
  if (!isSupabaseConfigured) return { ok: true, data: null }
  const { data, error } = await supabase
    .from('pickup_tasks')
    .select('*, food_claims(*, food_listings(*, donors(restaurant_name,donor_type)), receivers(*))')
    .order('created_at', { ascending: false })
  return error ? normalizeError(error) : { ok: true, data }
}

export async function acceptPickup(taskId) {
  if (!isSupabaseConfigured) return { ok: true }
  const { data, error } = await supabase.rpc('accept_pickup', { p_task_id: taskId })
  return error ? normalizeError(error) : { ok: true, data }
}

export async function advancePickup(taskId, status) {
  if (!isSupabaseConfigured) return { ok: true }
  const { data, error } = await supabase.rpc('advance_pickup', {
    p_task_id: taskId,
    p_next_status: status,
  })
  return error ? normalizeError(error) : { ok: true, data }
}

export async function getNotifications() {
  if (!isSupabaseConfigured) return { ok: true, data: null }
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
  return error ? normalizeError(error) : { ok: true, data }
}

export async function markNotificationRead(id) {
  if (!isSupabaseConfigured) return { ok: true }
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  return error ? normalizeError(error) : { ok: true }
}

export async function markAllNotificationsRead() {
  if (!isSupabaseConfigured) return { ok: true }
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return failure('You must be signed in.')
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', auth.user.id)
    .eq('is_read', false)
  return error ? normalizeError(error) : { ok: true }
}
