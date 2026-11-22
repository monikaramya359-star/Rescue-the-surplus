// Local mock state only. Replace these actions with Supabase queries and mutations without changing consumers.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { volunteerProfile } from '../data/volunteerData.js'
import {
  advanceTask,
  checkDeadlines,
  DEMO_VOLUNTEER_ID,
  formatNotificationTime,
  getNotificationsFor,
  getState,
  markAllNotificationsRead as markAllStoreNotificationsRead,
  markNotificationRead as markStoreNotificationRead,
  subscribe,
  subscribeNotifications,
} from '../lib/demoStore.js'

const VolunteerContext = createContext(null)

export function getPickupStatus(deadline, now) {
  return new Date(deadline).getTime() <= now ? 'expired' : 'open'
}

export function VolunteerProvider({ children }) {
  const demoState = useSyncExternalStore(subscribe, getState)
  const notificationState = useSyncExternalStore(subscribeNotifications, getState)
  const [profile, setProfile] = useState(volunteerProfile)
  const [now, setNow] = useState(() => Date.now())
  // Unassigned pickups waiting to be accepted.
  const pickups = useMemo(
    () => demoState.tasks.filter((task) => task.status === 'Claimed' && !task.volunteerId),
    [demoState.tasks],
  )
  // Tasks this volunteer has accepted.
  const tasks = useMemo(
    () => demoState.tasks.filter((task) => task.volunteerId === profile.id),
    [demoState.tasks, profile.id],
  )

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    checkDeadlines()
  }, [])

  // Notifications come from the store, already limited to this volunteer.
  const notifications = useMemo(
    () => getNotificationsFor(DEMO_VOLUNTEER_ID).map((n) => ({ ...n, time: formatNotificationTime(n.createdAt) })),
    [notificationState],
  )

  const availablePickups = useMemo(
    () =>
      pickups.map((pickup) => ({
        ...pickup,
        expired: getPickupStatus(pickup.pickupDeadline, now) === 'expired',
      })),
    [pickups, now],
  )

  // Each action returns the store result: { ok: true } or { ok: false, error }.
  const acceptPickup = useCallback(
    (pickupId) => {
      const pickup = pickups.find((item) => item.id === pickupId)
      if (!pickup) {
        return { ok: false, error: 'This pickup has already been taken' }
      }
      if (getPickupStatus(pickup.pickupDeadline, Date.now()) === 'expired') {
        return { ok: false, error: 'The pickup deadline has passed' }
      }
      return advanceTask(pickupId, 'Pickup Assigned', profile.id)
    },
    [pickups, profile.id],
  )

  const markCollected = useCallback((taskId) => advanceTask(taskId, 'Collected', profile.id), [profile.id])

  const markDelivered = useCallback((taskId) => advanceTask(taskId, 'Delivered', profile.id), [profile.id])

  const markNotificationRead = useCallback((id) => markStoreNotificationRead(DEMO_VOLUNTEER_ID, id), [])

  const markAllNotificationsRead = useCallback(() => markAllStoreNotificationsRead(DEMO_VOLUNTEER_ID), [])

  const updateProfile = useCallback((changes) => {
    setProfile((prev) => ({ ...prev, ...changes }))
  }, [])

  const stats = useMemo(() => {
    const assignedTasks = tasks.filter(
      (t) => t.status === 'Pickup Assigned' || t.status === 'Collected',
    ).length
    const completedPickups = tasks.filter(
      (t) => t.status === 'Collected' || t.status === 'Delivered',
    ).length
    const completedDeliveries = tasks.filter((t) => t.status === 'Delivered').length
    // Only meal-unit deliveries count as meals. Kg and Packets are not converted.
    const mealsDelivered = tasks
      .filter((t) => t.status === 'Delivered' && t.unit === 'Meals')
      .reduce((sum, t) => sum + Number(t.quantity || 0), 0)
    return {
      availablePickupTasks: pickups.length,
      assignedTasks,
      completedPickups,
      mealsDelivered,
      completedDeliveries,
    }
  }, [pickups, tasks])

  const value = useMemo(
    () => ({
      pickups: availablePickups,
      tasks,
      notifications,
      profile,
      now,
      stats,
      acceptPickup,
      markCollected,
      markDelivered,
      markNotificationRead,
      markAllNotificationsRead,
      updateProfile,
    }),
    [
      availablePickups,
      tasks,
      notifications,
      profile,
      now,
      stats,
      acceptPickup,
      markCollected,
      markDelivered,
      markNotificationRead,
      markAllNotificationsRead,
      updateProfile,
    ],
  )

  return <VolunteerContext.Provider value={value}>{children}</VolunteerContext.Provider>
}

export function useVolunteer() {
  const context = useContext(VolunteerContext)
  if (!context) {
    throw new Error('useVolunteer must be used inside VolunteerProvider')
  }
  return context
}
