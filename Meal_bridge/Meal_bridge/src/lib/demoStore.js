// Shared in-memory demo store. State is seeded from the mock data files and resets on page reload.
// Read it with useSyncExternalStore(subscribe, getState). Mutations return { ok, error } and notify subscribers.
import { donorProfile, seedNotifications as donorSeedNotifications } from '../data/donorData.js'
import {
  matchingReceivers,
  receiverProfile,
  seedListings,
  seedNotifications as receiverSeedNotifications,
} from '../data/receiverData.js'
import {
  seedAvailablePickups,
  seedNotifications as volunteerSeedNotifications,
  seedTasks,
  TASK_STEPS,
} from '../data/volunteerData.js'

// Demo identities. The dashboards read notifications for these ids.
export const DEMO_DONOR_ID = 'don-1'
export const DEMO_RECEIVER_ID = 'rec-1'
export const DEMO_VOLUNTEER_ID = 'vol-1'

const MINUTE_MS = 60000
const DEADLINE_WINDOW_MS = 60 * MINUTE_MS

// Seed notifications keep their existing title and message. agesInMinutes replaces the old "time" label.
function seedRecords(userId, role, seeds, agesInMinutes) {
  const now = Date.now()
  return seeds.map((seed, index) => ({
    id: `${userId}-${seed.id}`,
    recipientId: userId,
    recipientRole: role,
    type: 'general',
    title: seed.title,
    message: seed.message,
    createdAt: new Date(now - agesInMinutes[index] * MINUTE_MS).toISOString(),
    read: seed.read,
    dedupeKey: `seed-${seed.id}`,
  }))
}

let state = {
  listings: seedListings,
  // Unassigned pickups are tasks in 'Claimed' status with no volunteerId. A volunteer accepts one with advanceTask.
  tasks: [
    ...seedAvailablePickups.map((pickup) => ({
      ...pickup,
      pickupId: pickup.id,
      volunteerId: null,
      assignedAt: null,
      collectedAt: null,
      deliveredAt: null,
    })),
    ...seedTasks,
  ],
  // Deliveries completed during this session. Added on top of the impact seed numbers.
  sessionDeliveries: [],
  // One entry per successful task status change. Appended by advanceTask only.
  auditLog: [],
  // One record per recipient. Read only through getNotificationsFor, markNotificationRead and markAllNotificationsRead.
  notifications: [
    ...seedRecords(DEMO_DONOR_ID, 'donor', donorSeedNotifications, [10, 60, 1440, 2880]),
    ...seedRecords(DEMO_RECEIVER_ID, 'receiver', receiverSeedNotifications, [12, 40, 60, 1440]),
    ...seedRecords(DEMO_VOLUNTEER_ID, 'volunteer', volunteerSeedNotifications, [5, 25, 30, 1440]),
  ],
}

const listeners = new Set()
let notificationSeq = 0

function setState(next) {
  state = next
  listeners.forEach((listener) => listener())
}

export function getState() {
  return state
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// Read-only list of { taskId, from, to, actorId, at } entries, oldest first. Use subscribe() to hear about new entries.
export function getAuditLog() {
  return state.auditLog
}

// Notification subscriptions use the same listener set as the rest of the store.
export function subscribeNotifications(listener) {
  return subscribe(listener)
}

// Adds one notification for one recipient. Returns the new record, or null when the recipient is missing
// or a record with the same recipientId and dedupeKey already exists (idempotent).
// This is where a Supabase insert (RLS-protected) will later go. No database call is made here yet.
export function notify(recipientId, recipientRole, type, title, message, dedupeKey) {
  if (!recipientId) return null
  const duplicate = state.notifications.some(
    (item) => item.recipientId === recipientId && item.dedupeKey === dedupeKey,
  )
  if (duplicate) return null

  notificationSeq += 1
  const record = {
    id: `n-${Date.now()}-${notificationSeq}`,
    recipientId,
    recipientRole,
    type,
    title,
    message,
    createdAt: new Date().toISOString(),
    read: false,
    dedupeKey,
  }
  setState({ ...state, notifications: [...state.notifications, record] })
  return record
}

// The only read path the UI uses. Returns only this user's records, newest first.
export function getNotificationsFor(userId) {
  return state.notifications
    .map((record, index) => ({ record, index }))
    .filter(({ record }) => record.recipientId === userId)
    .sort((a, b) => b.record.createdAt.localeCompare(a.record.createdAt) || b.index - a.index)
    .map(({ record }) => record)
}

// Silently ignores records that belong to another user.
export function markNotificationRead(userId, notificationId) {
  const target = state.notifications.find((item) => item.id === notificationId)
  if (!target || target.recipientId !== userId || target.read) return
  setState({
    ...state,
    notifications: state.notifications.map((item) =>
      item.id === notificationId ? { ...item, read: true } : item,
    ),
  })
}

// Marks only this user's records as read.
export function markAllNotificationsRead(userId) {
  if (!state.notifications.some((item) => item.recipientId === userId && !item.read)) return
  setState({
    ...state,
    notifications: state.notifications.map((item) =>
      item.recipientId === userId ? { ...item, read: true } : item,
    ),
  })
}

// Relative label for a createdAt value, e.g. "12 min ago". Pages show this as their time text.
export function formatNotificationTime(iso) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / MINUTE_MS)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'Yesterday' : `${days} days ago`
}

// Demo links from data records to demo identities. A record links to the demo donor or receiver when its
// name matches the demo profile. Other records keep their own id. Those records are stored but no dashboard shows them.
function donorIdFor(record) {
  if (record.donorName === donorProfile.restaurantName) return DEMO_DONOR_ID
  return record.donorId ?? null
}

function receiverIdFor(record) {
  if (record.receiverName === receiverProfile.organizationName) return DEMO_RECEIVER_ID
  return record.receiverId ?? null
}

function formatClock(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// A donation was posted: confirm to the donor and tell each matching receiver about the new food.
export function recordDonationPosted(donation, donor = donorProfile) {
  const listing = {
    ...donation,
    donorId: DEMO_DONOR_ID,
    donorName: donor.restaurantName,
    donorType: donor.donorType,
    claimedQuantity: 0,
    distanceKm: null,
  }
  setState({ ...state, listings: [listing, ...state.listings] })

  const food = `${donation.foodName} (${donation.quantity} ${donation.unit})`
  notify(
    DEMO_DONOR_ID,
    'donor',
    'donation_posted',
    'Donation posted',
    `${food} is now listed for pickup.`,
    `posted-${donation.id}`,
  )
  matchingReceivers.forEach((receiver) => {
    notify(
      receiver.id,
      'receiver',
      'new_listing',
      'New food nearby',
      `${food} from ${donor.restaurantName} is available nearby.`,
      `new-listing-${donation.id}`,
    )
  })
}

// A receiver claimed food from a listing: confirm to the receiver and tell the listing's donor.
export function recordFoodClaimed(claim, listing) {
  const food = `${claim.quantityClaimed} ${claim.unit} of ${listing.foodName}`
  notify(
    DEMO_RECEIVER_ID,
    'receiver',
    'claim_confirmed',
    'Claim confirmed',
    `You claimed ${food} from ${listing.donorName}.`,
    `claimed-${claim.id}`,
  )
  notify(
    donorIdFor(listing),
    'donor',
    'food_claimed',
    'Food claimed',
    `${receiverProfile.organizationName} claimed ${food}.`,
    `claimed-${claim.id}`,
  )
}

// Notifications for a task status change. Called only from advanceTask after the task is saved.
function notifyTaskProgress(task, nextStatus, volunteerId) {
  const food = task.foodName
  const donorId = donorIdFor(task)
  const receiverId = receiverIdFor(task)

  if (nextStatus === 'Pickup Assigned') {
    notify(
      volunteerId,
      'volunteer',
      'pickup_accepted',
      'Pickup accepted',
      `You accepted the pickup of ${food} from ${task.donorName}.`,
      `accepted-${task.id}`,
    )
    notify(
      donorId,
      'donor',
      'pickup_accepted',
      'Volunteer assigned',
      `A volunteer has accepted the pickup of ${food}.`,
      `accepted-${task.id}`,
    )
    notify(
      receiverId,
      'receiver',
      'pickup_accepted',
      'Volunteer assigned',
      `A volunteer has accepted the pickup of ${food} for ${task.receiverName}.`,
      `accepted-${task.id}`,
    )
  } else if (nextStatus === 'Collected') {
    notify(
      donorId,
      'donor',
      'food_collected',
      'Food collected',
      `${food} was collected from ${task.pickupLocation}.`,
      `collected-${task.id}`,
    )
    notify(
      receiverId,
      'receiver',
      'food_collected',
      'Food collected',
      `${food} has been collected and is on its way to ${task.receiverName}.`,
      `collected-${task.id}`,
    )
  } else if (nextStatus === 'Delivered') {
    notify(
      donorId,
      'donor',
      'food_delivered',
      'Food delivered',
      `${food} was delivered to ${task.receiverName}.`,
      `delivered-${task.id}`,
    )
    notify(
      receiverId,
      'receiver',
      'food_delivered',
      'Food delivered',
      `${food} was delivered to your organization.`,
      `delivered-${task.id}`,
    )
    notify(
      volunteerId,
      'volunteer',
      'food_delivered',
      'Delivery complete',
      `${food} was delivered to ${task.receiverName}. Thank you.`,
      `delivered-${task.id}`,
    )
  }
}

// Notifies the donor and the assigned volunteer about pickups due within the next hour, and the donor about
// listings due within the next hour. Dedupe keys keep each entity to one reminder. Called on store init and when
// the donor and volunteer dashboards mount. No timers.
export function checkDeadlines(now = Date.now()) {
  const inWindow = (deadline) => {
    const remaining = new Date(deadline).getTime() - now
    return remaining > 0 && remaining <= DEADLINE_WINDOW_MS
  }

  const dueTasks = state.tasks.filter((task) => task.status !== 'Delivered' && inWindow(task.pickupDeadline))
  const dueListings = state.listings.filter(
    (listing) => listing.quantity - listing.claimedQuantity > 0 && inWindow(listing.pickupDeadline),
  )

  dueTasks.forEach((task) => {
    const title = 'Pickup deadline approaching'
    const message = `Pickup of ${task.foodName} is due by ${formatClock(task.pickupDeadline)}.`
    notify(donorIdFor(task), 'donor', 'deadline', title, message, `deadline-${task.id}`)
    notify(task.volunteerId, 'volunteer', 'deadline', title, message, `deadline-${task.id}`)
  })
  dueListings.forEach((listing) => {
    const message = `Listing ${listing.foodName} is due by ${formatClock(listing.pickupDeadline)}.`
    notify(
      donorIdFor(listing),
      'donor',
      'deadline',
      'Pickup deadline approaching',
      message,
      `deadline-${listing.id}`,
    )
  })
}

// Claims quantity from a listing. Rejects amounts above what is still left.
export function claimListing(listingId, quantity) {
  if (!Number.isInteger(quantity) || quantity < 1) {
    return { ok: false, error: 'Enter a whole number of at least 1' }
  }
  const listing = state.listings.find((item) => item.id === listingId)
  if (!listing) {
    return { ok: false, error: 'This listing is no longer available' }
  }
  const remaining = listing.quantity - listing.claimedQuantity
  if (remaining <= 0) {
    return { ok: false, error: 'This listing has already been fully claimed' }
  }
  if (quantity > remaining) {
    return { ok: false, error: `Only ${remaining} ${listing.unit} left available` }
  }

  setState({
    ...state,
    listings: state.listings.map((item) =>
      item.id === listingId ? { ...item, claimedQuantity: item.claimedQuantity + quantity } : item,
    ),
  })
  return { ok: true }
}

// The only place a task status changes. Moves a task one step along TASK_STEPS for the volunteer acting on it.
// Claimed -> Pickup Assigned is the accept step: an unassigned task is given to the actor.
// Later steps are only allowed for the volunteer already assigned to the task.
export function advanceTask(taskId, nextStatus, actorVolunteerId) {
  const task = state.tasks.find((item) => item.id === taskId)
  if (!task) {
    return { ok: false, error: 'This task could not be found' }
  }
  if (!actorVolunteerId) {
    return { ok: false, error: 'Sign in as a volunteer to update this task' }
  }
  if (task.volunteerId && task.volunteerId !== actorVolunteerId) {
    return { ok: false, error: 'This task is assigned to another volunteer' }
  }
  if (!task.volunteerId && task.status !== 'Claimed') {
    return { ok: false, error: 'This task has no volunteer assigned' }
  }

  const currentIndex = TASK_STEPS.indexOf(task.status)
  const nextIndex = TASK_STEPS.indexOf(nextStatus)
  const expectedNext = TASK_STEPS[currentIndex + 1]
  if (nextIndex === -1) {
    return { ok: false, error: `"${nextStatus}" is not a task status` }
  }
  if (!expectedNext) {
    return { ok: false, error: 'This task is already delivered' }
  }
  if (nextIndex < currentIndex + 1) {
    return { ok: false, error: `A ${task.status} task cannot move back to ${nextStatus}` }
  }
  if (nextIndex > currentIndex + 1) {
    return { ok: false, error: `A ${task.status} task cannot skip to ${nextStatus}. The next step is ${expectedNext}` }
  }

  const timestamp = new Date().toISOString()
  const timestamps =
    nextStatus === 'Pickup Assigned'
      ? { assignedAt: timestamp }
      : nextStatus === 'Collected'
        ? { collectedAt: timestamp }
        : { deliveredAt: timestamp }
  const updatedTask = { ...task, status: nextStatus, volunteerId: actorVolunteerId, ...timestamps }

  const sessionDeliveries =
    nextStatus === 'Delivered'
      ? [
          ...state.sessionDeliveries,
          {
            ...updatedTask,
            category: state.listings.find((item) => item.foodName === task.foodName)?.category ?? 'Other',
          },
        ]
      : state.sessionDeliveries

  // This is where the database write will go later: save the task change and its audit row before updating state.
  setState({
    ...state,
    tasks: state.tasks.map((item) => (item.id === taskId ? updatedTask : item)),
    sessionDeliveries,
    auditLog: [
      ...state.auditLog,
      { taskId, from: task.status, to: nextStatus, actorId: actorVolunteerId, at: timestamp },
    ],
  })
  notifyTaskProgress(updatedTask, nextStatus, actorVolunteerId)
  return { ok: true, task: updatedTask }
}

// Startup: check deadlines once when the store loads.
checkDeadlines()
