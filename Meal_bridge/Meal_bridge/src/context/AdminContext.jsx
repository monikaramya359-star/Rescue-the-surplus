// Local mock state only. Replace these actions with Supabase queries and mutations without changing consumers.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { seedUsers, seedAdminListings, seedAdminPickups } from '../data/adminData.js'
import { isSupabaseConfigured, supabase } from '../lib/supabase.js'

const AdminContext = createContext(null)

export function getEffectiveListingStatus(listing, now) {
  if (listing.status === 'Active' && new Date(listing.pickupDeadline).getTime() <= now) {
    return 'Expired'
  }
  return listing.status
}

export function AdminProvider({ children }) {
  const [users, setUsers] = useState(seedUsers)
  const [listings, setListings] = useState(seedAdminListings)
  const [pickups, setPickups] = useState(seedAdminPickups)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined
    let active = true
    Promise.all([
      supabase.from('users').select('id,role,email,phone,location,account_status,created_at'),
      supabase.from('food_listings').select('*').order('created_at', { ascending: false }),
      supabase.from('pickup_tasks').select('*, food_claims(*, food_listings(*))').order('created_at', { ascending: false }),
    ]).then(([userResult, listingResult, pickupResult]) => {
      if (!active) return
      if (userResult.data) {
        setUsers(userResult.data.map((user) => ({
          id: user.id,
          name: user.email,
          email: user.email,
          role: user.role,
          status: user.account_status,
          joined: user.created_at?.slice(0, 10),
        })))
      } else {
        console.warn('[AdminContext] Supabase users query failed:', userResult.error)
      }
      if (listingResult.data) {
        setListings(listingResult.data.map((listing) => ({
          id: listing.id,
          foodName: listing.food_name,
          quantity: listing.quantity,
          unit: listing.unit,
          status: listing.status,
          pickupDeadline: listing.pickup_deadline,
        })))
      } else {
        console.warn('[AdminContext] Supabase food_listings query failed:', listingResult.error)
      }
      if (pickupResult.data) {
        setPickups(pickupResult.data.map((task) => ({
          id: task.id,
          status: task.status,
          pickupDeadline: task.food_claims?.food_listings?.pickup_deadline,
        })))
      } else {
        console.warn('[AdminContext] Supabase pickup_tasks query failed:', pickupResult.error)
      }
    })
    return () => { active = false }
  }, [])

  const listingsWithStatus = useMemo(
    () =>
      listings.map((listing) => ({
        ...listing,
        effectiveStatus: getEffectiveListingStatus(listing, now),
      })),
    [listings, now],
  )

  const stats = useMemo(() => {
    const usersByRole = {
      donor: users.filter((u) => u.role === 'donor').length,
      receiver: users.filter((u) => u.role === 'receiver').length,
      volunteer: users.filter((u) => u.role === 'volunteer').length,
    }
    const activeDonations = listingsWithStatus.filter(
      (l) => l.effectiveStatus === 'Active' || l.effectiveStatus === 'Claimed',
    ).length
    const completedDeliveries = pickups.filter((p) => p.status === 'Delivered').length
    const expiredListings = listingsWithStatus.filter(
      (l) => l.effectiveStatus === 'Expired',
    ).length
    const ongoingPickups = pickups.filter(
      (p) => p.status === 'Pickup Assigned' || p.status === 'Collected',
    ).length
    return {
      registeredUsers: users.length,
      usersByRole,
      activeDonations,
      completedDeliveries,
      expiredListings,
      ongoingPickups,
    }
  }, [users, listingsWithStatus, pickups])

  const toggleUserStatus = useCallback((userId) => {
    if (isSupabaseConfigured) {
      const user = users.find((item) => item.id === userId)
      const nextStatus = user?.status === 'Suspended' ? 'Active' : 'Suspended'
      return supabase.rpc('admin_set_account_status', {
        p_user_id: userId,
        p_status: nextStatus,
      }).then(({ error }) => error
        ? { ok: false, error: error.message }
        : { ok: true })
    }
    setUsers((prev) =>
      prev.map((user) => {
        if (user.id !== userId) return user
        if (user.status === 'Active') return { ...user, status: 'Suspended' }
        if (user.status === 'Suspended') return { ...user, status: 'Active' }
        return user
      }),
    )
  }, [])

  const cancelListing = useCallback(
    async (listingId) => {
      if (isSupabaseConfigured) {
        const { error } = await supabase.rpc('admin_cancel_listing', {
          p_listing_id: listingId,
        })
        return error ? { ok: false, error: error.message } : { ok: true }
      }
      const listing = listings.find((item) => item.id === listingId)
      const effective = listing ? getEffectiveListingStatus(listing, Date.now()) : null
      if (effective !== 'Active' && effective !== 'Claimed') {
        return { ok: false, error: 'Only active or claimed listings can be cancelled' }
      }
      setListings((prev) =>
        prev.map((item) => (item.id === listingId ? { ...item, status: 'Cancelled' } : item)),
      )
      return { ok: true }
    },
    [listings],
  )

  const value = useMemo(
    () => ({
      users,
      listings: listingsWithStatus,
      pickups,
      stats,
      now,
      toggleUserStatus,
      cancelListing,
    }),
    [users, listingsWithStatus, pickups, stats, now, toggleUserStatus, cancelListing],
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin must be used inside AdminProvider')
  }
  return context
}
