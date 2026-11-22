// Local mock state only. Replace these actions with Supabase queries and mutations without changing consumers.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { receiverProfile, seedClaims } from '../data/receiverData.js'
import {
  claimListing as claimListingInStore,
  DEMO_RECEIVER_ID,
  formatNotificationTime,
  getNotificationsFor,
  getState,
  markAllNotificationsRead as markAllStoreNotificationsRead,
  markNotificationRead as markStoreNotificationRead,
  recordFoodClaimed,
  subscribe,
  subscribeNotifications,
} from '../lib/demoStore.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import {
  claimListing,
  getAvailableListings,
  getReceiverClaims,
  getNotifications,
  markNotificationRead as markStoreNotificationReadInDb,
  markAllNotificationsRead as markAllStoreNotificationsReadInDb,
  normalizeClaim,
  normalizeListing,
} from '../services/mealService.js'

const ReceiverContext = createContext(null)

const CLOSING_WINDOW_MINUTES = 120

export function getDeadlineState(deadline, now) {
  const deadlineMs = new Date(deadline).getTime()
  const minutesLeft = Math.floor((deadlineMs - now) / 60000)
  if (deadlineMs <= now) {
    return { state: 'expired', minutesLeft: 0 }
  }
  if (minutesLeft < CLOSING_WINDOW_MINUTES) {
    return { state: 'closing', minutesLeft }
  }
  return { state: 'open', minutesLeft }
}

export function getListingStatus(listing, now) {
  if (new Date(listing.pickupDeadline).getTime() <= now) {
    return 'Expired'
  }
  if (listing.quantity - listing.claimedQuantity <= 0) {
    return 'Claimed'
  }
  return 'Available'
}

export function ReceiverProvider({ children }) {
  const demoState = useSyncExternalStore(subscribe, getState)
  const listingsState = demoState.listings
  const [supabaseListings, setSupabaseListings] = useState(null)
  const [supabaseNotifications, setSupabaseNotifications] = useState(null)
  const [claims, setClaims] = useState(seedClaims)
  const notificationState = useSyncExternalStore(subscribeNotifications, getState)
  const [profile, setProfile] = useState(receiverProfile)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined
    let active = true
    async function refresh() {
      const [listingsResult, claimsResult, notificationsResult] = await Promise.all([
        getAvailableListings(),
        getReceiverClaims(),
        getNotifications(),
      ])
      if (!active) return
      if (listingsResult.ok && listingsResult.data) setSupabaseListings(listingsResult.data.map(normalizeListing))
      if (claimsResult.ok && claimsResult.data) setClaims(claimsResult.data.map(normalizeClaim))
      if (notificationsResult.ok && notificationsResult.data) setSupabaseNotifications(notificationsResult.data)
    }
    refresh()
    const timer = setInterval(refresh, 12000)
    return () => { active = false; clearInterval(timer) }
  }, [])

  // Notifications come from the store, already limited to this receiver.
  const notifications = useMemo(() => {
    if (isSupabaseConfigured && supabaseNotifications) {
      return supabaseNotifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        read: n.is_read,
        time: formatNotificationTime(n.created_at),
      }))
    }
    return getNotificationsFor(DEMO_RECEIVER_ID).map((n) => ({ ...n, time: formatNotificationTime(n.createdAt) }))
  }, [supabaseNotifications, notificationState])

  const listings = useMemo(
    () =>
      (supabaseListings || listingsState).map((listing) => ({
        ...listing,
        availableQuantity: listing.quantity - listing.claimedQuantity,
        status: getListingStatus(listing, now),
      })),
    [supabaseListings, listingsState, now],
  )

  const claimFood = useCallback(
    async (donationId, quantity) => {
      if (isSupabaseConfigured) {
        const serviceResult = await claimListing(donationId, quantity)
        if (serviceResult.ok) {
          // Refresh claims from the demo store so the UI reflects the claim immediately.
          const fresh = getState()
          const listing = fresh.listings.find((item) => item.id === donationId)
          if (listing) {
            const claim = {
              id: 'c-' + Date.now(),
              donationId,
              foodName: listing.foodName,
              donorName: listing.donorName,
              image: listing.image,
              quantityClaimed: quantity,
              unit: listing.unit,
              pickupLocation: listing.pickupLocation,
              storage: listing.storage,
              allergens: listing.allergens,
              pickupDeadline: listing.pickupDeadline,
              claimedAt: new Date().toISOString(),
              status: 'Claimed',
            }
            setClaims((prev) => [claim, ...prev])
            recordFoodClaimed(claim, listing)
            return { ok: true, claim }
          }
          return { ok: true }
        }
        console.warn(
          '[ReceiverContext] Supabase claimListing failed, falling back to demo store:',
          serviceResult.error,
        )
      }
      if (!Number.isInteger(quantity) || quantity < 1) {
        return { ok: false, error: 'Enter a whole number of at least 1' }
      }
      const listing = listings.find((item) => item.id === donationId)
      if (!listing || listing.status !== 'Available') {
        return { ok: false, error: 'This listing is no longer available' }
      }
      if (quantity > listing.availableQuantity) {
        return { ok: false, error: `Only ${listing.availableQuantity} ${listing.unit} left available` }
      }

      // The store re-checks the remaining quantity against its latest state.
      const claimResult = claimListingInStore(donationId, quantity)
      if (!claimResult.ok) {
        return claimResult
      }

      const claim = {
        id: 'c-' + Date.now(),
        donationId,
        foodName: listing.foodName,
        donorName: listing.donorName,
        image: listing.image,
        quantityClaimed: quantity,
        unit: listing.unit,
        pickupLocation: listing.pickupLocation,
        storage: listing.storage,
        allergens: listing.allergens,
        pickupDeadline: listing.pickupDeadline,
        claimedAt: new Date().toISOString(),
        status: 'Claimed',
      }

      setClaims((prev) => [claim, ...prev])
      recordFoodClaimed(claim, listing)
      return { ok: true, claim }
    },
    [listings],
  )

  const markCollected = useCallback((claimId) => {
    setClaims((prev) =>
      prev.map((claim) =>
        claim.id === claimId && claim.status === 'Claimed'
          ? { ...claim, status: 'Collected', collectedAt: new Date().toISOString() }
          : claim,
      ),
    )
  }, [])

  const markDelivered = useCallback((claimId) => {
    setClaims((prev) =>
      prev.map((claim) =>
        claim.id === claimId && claim.status === 'Collected'
          ? { ...claim, status: 'Delivered', deliveredAt: new Date().toISOString() }
          : claim,
      ),
    )
  }, [])

  const markNotificationRead = useCallback((id) => isSupabaseConfigured
    ? markStoreNotificationReadInDb(id)
    : markStoreNotificationRead(DEMO_RECEIVER_ID, id), [])

  const markAllNotificationsRead = useCallback(() => isSupabaseConfigured
    ? markAllStoreNotificationsReadInDb()
    : markAllStoreNotificationsRead(DEMO_RECEIVER_ID), [])

  const updateProfile = useCallback((changes) => {
    setProfile((prev) => ({ ...prev, ...changes }))
  }, [])

  const stats = useMemo(() => {
    const availableDonations = listings.filter((l) => l.status === 'Available').length
    const donationsClaimed = claims.length
    const foodReceived = { Meals: 0, Kg: 0, Packets: 0 }
    claims
      .filter((c) => c.status === 'Delivered')
      .forEach((c) => {
        foodReceived[c.unit] = (foodReceived[c.unit] || 0) + Number(c.quantityClaimed || 0)
      })
    // Only meal-unit deliveries count as meals. Kg and Packets are not converted.
    const mealsDistributed = foodReceived.Meals
    return { availableDonations, donationsClaimed, foodReceived, mealsDistributed }
  }, [listings, claims])

  const value = useMemo(
    () => ({
      listings,
      claims,
      notifications,
      profile,
      now,
      stats,
      claimFood,
      markCollected,
      markDelivered,
      markNotificationRead,
      markAllNotificationsRead,
      updateProfile,
    }),
    [
      listings,
      claims,
      notifications,
      profile,
      now,
      stats,
      claimFood,
      markCollected,
      markDelivered,
      markNotificationRead,
      markAllNotificationsRead,
      updateProfile,
    ],
  )

  return <ReceiverContext.Provider value={value}>{children}</ReceiverContext.Provider>
}

export function useReceiver() {
  const context = useContext(ReceiverContext)
  if (!context) {
    throw new Error('useReceiver must be used inside ReceiverProvider')
  }
  return context
}
