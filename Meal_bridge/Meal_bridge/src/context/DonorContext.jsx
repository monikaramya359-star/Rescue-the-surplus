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

const DonorContext = createContext(null)

export function DonorProvider({ children }) {
  const notificationState = useSyncExternalStore(subscribeNotifications, getState)
  const [donations, setDonations] = useState(seedDonations)
  const [profile, setProfile] = useState(donorProfile)

  useEffect(() => {
    checkDeadlines()
  }, [])

  // Notifications come from the store, already limited to this donor.
  const notifications = useMemo(
    () => getNotificationsFor(DEMO_DONOR_ID).map((n) => ({ ...n, time: formatNotificationTime(n.createdAt) })),
    [notificationState],
  )

  const addDonation = useCallback((values) => {
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

  const updateDonation = useCallback((id, changes) => {
    setDonations((prev) => prev.map((d) => (d.id === id ? { ...d, ...changes } : d)))
  }, [])

  const cancelDonation = useCallback((id) => {
    setDonations((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'Cancelled' } : d)))
  }, [])

  // Demo progression only. Status changes to Delivered/Collected happen here
  // solely when a user action explicitly asks for them.
  const setDonationStatus = useCallback((id, status) => {
    setDonations((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)))
  }, [])

  const markNotificationRead = useCallback((id) => markStoreNotificationRead(DEMO_DONOR_ID, id), [])

  const markAllNotificationsRead = useCallback(() => markAllStoreNotificationsRead(DEMO_DONOR_ID), [])

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
