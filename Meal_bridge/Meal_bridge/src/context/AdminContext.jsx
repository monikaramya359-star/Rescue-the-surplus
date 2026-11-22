// Local mock state only. Replace these actions with Supabase queries and mutations without changing consumers.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { seedUsers, seedAdminListings, seedAdminPickups } from '../data/adminData.js'

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
  const [pickups] = useState(seedAdminPickups)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(timer)
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
    (listingId) => {
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
