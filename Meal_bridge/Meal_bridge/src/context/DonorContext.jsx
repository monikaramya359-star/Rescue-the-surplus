// Local mock state only. Replace these actions with Supabase queries/mutations without changing consumers.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { donorProfile, seedDonations } from '../data/donorData.js'
import {
  checkDeadlines,
  DEMO_DONOR_ID,
  formatNotificationTime,
  getNotificationsFor,
  getState,
  markAllNotificationsRead as markAllStoreNotificationsRead,
  markNotificationRead as markStoreNotificationRead,
  recordDonationPosted,
  subscribeNotifications,
} from '../lib/demoStore.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import {
  cancelListing,
  createListing,
  getDonorListings,
  getNotifications,
  markNotificationRead as markStoreNotificationReadInDb,
  markAllNotificationsRead as markAllStoreNotificationsReadInDb,
  normalizeListing,
  updateListing,
} from '../services/mealService.js'

const DonorContext = createContext(null)

export function DonorProvider({ children }) {
  const notificationState = useSyncExternalStore(subscribeNotifications, getState)
  const [donations, setDonations] = useState(seedDonations)
  const [profile, setProfile] = useState(donorProfile)
  const [supabaseNotifications, setSupabaseNotifications] = useState(null)

  useEffect(() => {
    checkDeadlines()
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined
    let active = true
    async function refresh() {
      const [listingResult, notificationsResult] = await Promise.all([getDonorListings(), getNotifications()])
      if (!active) return
      if (listingResult.ok && listingResult.data) setDonations(listingResult.data.map(normalizeListing))
      if (notificationsResult.ok && notificationsResult.data) setSupabaseNotifications(notificationsResult.data)
    }
    refresh()
    const timer = setInterval(refresh, 12000)
    return () => { active = false; clearInterval(timer) }
  }, [])

  // Notifications come from the store, already limited to this donor.
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
    return getNotificationsFor(DEMO_DONOR_ID).map((n) => ({ ...n, time: formatNotificationTime(n.createdAt) }))
  }, [supabaseNotifications, notificationState])

  const addDonation = useCallback(async (values) => {
    if (isSupabaseConfigured) {
      const result = await createListing({
        ...values,
        imageUrl: values.imageUrl || null,
      })
      // No demo fallback here: a failed save must not look like a success.
      // The caller keeps the form values and shows the message.
      if (!result.ok) {
        return {
          ok: false,
          message: result.message || 'We could not post this listing. Your details are still here, so please try again.',
        }
      }
      return { ok: true, id: result.data.id, ...values }
    }
    const donation = {
      ...values,
      id: 'd-' + Date.now(),
      status: 'Active',
      postedAt: new Date().toISOString(),
    }
    setDonations((prev) => [donation, ...prev])
    recordDonationPosted(donation, profile)
    return donation
  }, [profile])

  const updateDonation = useCallback(async (id, changes) => {
    if (isSupabaseConfigured) {
      const result = await updateListing(id, {
        ...changes,
        imageUrl: changes.imageUrl || null,
      })
      if (result.ok) {
        return result
      }
      console.warn(
        '[DonorContext] Supabase updateListing failed, falling back to demo store:',
        result.error,
      )
    }
    setDonations((prev) => prev.map((d) => (d.id === id ? { ...d, ...changes } : d)))
    return { ok: true }
  }, [])

  const cancelDonation = useCallback(async (id) => {
    if (isSupabaseConfigured) {
      const result = await cancelListing(id)
      if (result.ok) {
        setDonations((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'Cancelled' } : d)))
        return result
      }
      console.warn(
        '[DonorContext] Supabase cancelListing failed, falling back to demo store:',
        result.error,
      )
    }
    setDonations((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'Cancelled' } : d)))
    return { ok: true }
  }, [])

  // Demo progression only. Status changes to Delivered/Collected happen here
  // solely when a user action explicitly asks for them.
  const setDonationStatus = useCallback((id, status) => {
    setDonations((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)))
  }, [])

  const markNotificationRead = useCallback((id) => isSupabaseConfigured
    ? markStoreNotificationReadInDb(id)
    : markStoreNotificationRead(DEMO_DONOR_ID, id), [])

  const markAllNotificationsRead = useCallback(() => isSupabaseConfigured
    ? markAllStoreNotificationsReadInDb()
    : markAllStoreNotificationsRead(DEMO_DONOR_ID), [])

  const updateProfile = useCallback((changes) => {
    setProfile((prev) => ({ ...prev, ...changes }))
  }, [])

  const stats = useMemo(() => {
    const totalDonations = donations.length
    const activeListings = donations.filter((d) => d.status === 'Active').length
    const successfulDonations = donations.filter((d) => d.status === 'Delivered').length
    // Only Meals are counted. Kg and Packets are not converted to meals.
    const mealsRescued = donations
      .filter((d) => d.status === 'Delivered' && d.unit === 'Meals')
      .reduce((sum, d) => sum + Number(d.quantity || 0), 0)
    return { totalDonations, activeListings, successfulDonations, mealsRescued }
  }, [donations])

  const value = useMemo(
    () => ({
      donations,
      notifications,
      profile,
      stats,
      addDonation,
      updateDonation,
      cancelDonation,
      setDonationStatus,
      markNotificationRead,
      markAllNotificationsRead,
      updateProfile,
    }),
    [
      donations,
      notifications,
      profile,
      stats,
      addDonation,
      updateDonation,
      cancelDonation,
      setDonationStatus,
      markNotificationRead,
      markAllNotificationsRead,
      updateProfile,
    ],
  )

  return <DonorContext.Provider value={value}>{children}</DonorContext.Provider>
}

export function useDonor() {
  const context = useContext(DonorContext)
  if (!context) {
    throw new Error('useDonor must be used inside a DonorProvider')
  }
  return context
}
